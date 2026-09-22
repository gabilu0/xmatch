import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Repository } from 'typeorm';
import { Partida } from './entities/partida.entity';
import { PartidaResultado } from './entities/partida-resultado.entity';
import { Jogo } from '../jogo/entities/jogo.entity';
import { JogoMembro } from '../jogo/entities/jogo-membro.entity';
import { Season } from '../jogo/entities/season.entity';
import { SalaMembro } from '../sala/entities/sala-membro.entity';
import { RegistrarVitoriaDto } from './dto/registrar-vitoria.dto';
import { NotificacaoService } from '../notificacao/notificacao.service';

const HORAS_24_EM_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PartidaService {
  constructor(
    @InjectRepository(Partida)
    private readonly partidaRepository: Repository<Partida>,
    @InjectRepository(PartidaResultado)
    private readonly partidaResultadoRepository: Repository<PartidaResultado>,
    @InjectRepository(Jogo)
    private readonly jogoRepository: Repository<Jogo>,
    @InjectRepository(JogoMembro)
    private readonly jogoMembroRepository: Repository<JogoMembro>,
    @InjectRepository(Season)
    private readonly seasonRepository: Repository<Season>,
    @InjectRepository(SalaMembro)
    private readonly salaMembros: Repository<SalaMembro>,
    private readonly notificacaoService: NotificacaoService,
  ) {}

  // Ver UC-13 (Duelo), UC-14 (Competição e Rei do Pedaço), RF-04.1.
  // Vitória entra direto no placar, em estado 'pendente' (RF-04.3) — não é
  // um estado de aprovação prévia, é a janela de 24h pra contestação.
  async registrarVitoria(
    registradoPorId: string,
    jogoId: string,
    dto: RegistrarVitoriaDto,
  ) {
    const jogo = await this.jogoRepository.findOne({ where: { id: jogoId }, relations: ['sala'] });
    if (!jogo) {
      throw new NotFoundException('Jogo não encontrado.');
    }
    if (jogo.sala.encerrada || jogo.arquivado) {
      throw new ConflictException('Este jogo não aceita novas partidas.');
    }
    const membroDaSala = await this.salaMembros.findOne({ where: { salaId: jogo.salaId, usuarioId: registradoPorId } });
    if (!membroDaSala) throw new ForbiddenException('Você não é membro dessa sala.');

    const membrosDoJogo = await this.jogoMembroRepository.find({
      where: { jogoId },
    });
    const idsDoJogo = membrosDoJogo.map((m) => m.usuarioId);

    if (!idsDoJogo.includes(registradoPorId)) {
      throw new ForbiddenException('Você não é membro desse jogo.');
    }

    const perdedores = this.determinarPerdedores(
      jogo,
      idsDoJogo,
      registradoPorId,
      dto,
    );

    const seasonAtiva = jogo.ciclo === 'season'
      ? await this.seasonRepository.findOne({
          where: { jogoId, encerradaEm: IsNull() },
        })
      : null;

    const partida = this.partidaRepository.create({
      jogoId,
      seasonId: seasonAtiva?.id ?? null,
      registradoPor: registradoPorId,
      status: 'pendente',
      expiraEm: new Date(Date.now() + HORAS_24_EM_MS),
    });
    await this.partidaRepository.save(partida);

    const resultados = [
      this.partidaResultadoRepository.create({
        partidaId: partida.id,
        usuarioId: registradoPorId,
        vencedor: true,
        pontos: 1,
      }),
      ...perdedores.map((usuarioId) =>
        this.partidaResultadoRepository.create({
          partidaId: partida.id,
          usuarioId,
          vencedor: false,
          pontos: 0,
        }),
      ),
    ];
    await this.partidaResultadoRepository.save(resultados);

    // Ver fase3_arquitetura_completa (tipo 'vitoria_registrada'). Só os
    // perdedores recebem — quem registrou já sabe o que fez.
    await Promise.all(
      perdedores.map((usuarioId) =>
        this.notificacaoService.criar(usuarioId, 'vitoria_registrada', {
          jogoId,
          partidaId: partida.id,
        }),
      ),
    );

    return { ...partida, resultados };
  }

  // Ver UC-11 (modos) e UC-13/UC-14 (quem perde em cada um).
  private determinarPerdedores(
    jogo: Jogo,
    idsDoJogo: string[],
    registradoPorId: string,
    dto: RegistrarVitoriaDto,
  ): string[] {
    switch (jogo.modo) {
      case 'duelo': {
        // Adversário implícito — o único outro membro (RF-03.7).
        return idsDoJogo.filter((id) => id !== registradoPorId);
      }
      case 'competicao': {
        // Todos os outros perdem automaticamente (RF-03.8).
        return idsDoJogo.filter((id) => id !== registradoPorId);
      }
      case 'rei_do_pedaco': {
        if (!dto.perdedorId) {
          throw new BadRequestException(
            'Modo rei_do_pedaco exige informar quem perdeu (perdedorId).',
          );
        }
        if (dto.perdedorId === registradoPorId) {
          throw new BadRequestException(
            'Você não pode se marcar como perdedor da própria vitória.',
          );
        }
        if (!idsDoJogo.includes(dto.perdedorId)) {
          throw new BadRequestException(
            'O perdedor selecionado precisa ser membro desse jogo.',
          );
        }
        return [dto.perdedorId];
      }
    }
  }

  // Ver UC-15 e RF-04.5. Qualquer membro do jogo pode contestar — não só
  // quem foi marcado como perdedor.
  async contestar(usuarioId: string, partidaId: string) {
    const partida = await this.buscarEValidarMembro(usuarioId, partidaId);

    if (partida.status !== 'pendente') {
      throw new ConflictException(
        'Só é possível contestar uma partida pendente.',
      );
    }

    partida.status = 'contestada';
    await this.partidaRepository.save(partida);

    await this.notificacaoService.criar(
      partida.registradoPor,
      'partida_contestada',
      { jogoId: partida.jogoId, partidaId: partida.id },
    );

    return partida;
  }

  // Ver UC-15 / RF-04.7: resolução manual de uma partida contestada.
  async confirmar(usuarioId: string, partidaId: string) {
    const partida = await this.buscarEValidarMembro(usuarioId, partidaId);

    if (partida.status !== 'contestada') {
      throw new ConflictException(
        'Só é possível confirmar manualmente uma partida contestada.',
      );
    }

    partida.status = 'confirmada';
    await this.partidaRepository.save(partida);

    await this.notificacaoService.criar(
      partida.registradoPor,
      'partida_confirmada',
      { jogoId: partida.jogoId, partidaId: partida.id },
    );

    await this.verificarMetaSeason(partida.jogoId, partida.seasonId);

    return partida;
  }

  async cancelar(usuarioId: string, partidaId: string) {
    const partida = await this.buscarEValidarMembro(usuarioId, partidaId);

    if (partida.status !== 'contestada') {
      throw new ConflictException(
        'Só é possível cancelar uma partida contestada.',
      );
    }

    partida.status = 'cancelada';
    await this.partidaRepository.save(partida);

    await this.notificacaoService.criar(
      partida.registradoPor,
      'partida_cancelada',
      { jogoId: partida.jogoId, partidaId: partida.id },
    );

    return partida;
  }

  private async buscarEValidarMembro(usuarioId: string, partidaId: string) {
    const partida = await this.partidaRepository.findOne({
      where: { id: partidaId },
    });
    if (!partida) {
      throw new NotFoundException('Partida não encontrada.');
    }

    const membro = await this.jogoMembroRepository.findOne({
      where: { jogoId: partida.jogoId, usuarioId },
    });
    if (!membro) {
      throw new ForbiddenException('Você não é membro desse jogo.');
    }

    const jogo = await this.jogoRepository.findOne({ where: { id: partida.jogoId } });
    const membroDaSala = jogo && await this.salaMembros.findOne({ where: { salaId: jogo.salaId, usuarioId } });
    if (!membroDaSala) throw new ForbiddenException('Você não é membro dessa sala.');

    return partida;
  }

  async listarPorJogo(usuarioId: string, jogoId: string) {
    const jogo = await this.jogoRepository.findOne({ where: { id: jogoId } });
    if (!jogo) throw new NotFoundException('Jogo não encontrado.');
    const membroDaSala = await this.salaMembros.findOne({ where: { salaId: jogo.salaId, usuarioId } });
    if (!membroDaSala) throw new ForbiddenException('Você não é membro dessa sala.');
    const membro = await this.jogoMembroRepository.findOne({
      where: { jogoId, usuarioId },
    });
    if (!membro) throw new ForbiddenException('Você não é membro desse jogo.');
    const partidas = await this.partidaRepository.find({
      where: { jogoId },
      order: { criadoEm: 'DESC' },
      take: 100,
    });
    const resultados = partidas.length
      ? await this.partidaResultadoRepository
          .createQueryBuilder('resultado')
          .where('resultado.partidaId IN (:...ids)', { ids: partidas.map((p) => p.id) })
          .getMany()
      : [];
    return partidas.map((partida) => ({
      ...partida,
      resultados: resultados
        .filter((resultado) => resultado.partidaId === partida.id)
        .map((resultado) => ({
          usuarioId: resultado.usuarioId,
          vencedor: resultado.vencedor,
          pontos: resultado.pontos,
        })),
    }));
  }

  async listarPendentes(usuarioId: string) {
    const jogos = await this.jogoMembroRepository.find({ where: { usuarioId }, relations: ['jogo'] });
    const salas = await this.salaMembros.find({ where: { usuarioId } });
    const idsDasSalas = new Set(salas.map((sala) => sala.salaId));
    const jogosDoUsuario = jogos.filter((jogo) => idsDasSalas.has(jogo.jogo.salaId));
    if (!jogosDoUsuario.length) return [];
    const partidas = await this.partidaRepository
      .createQueryBuilder('partida')
      .where('partida.jogoId IN (:...ids)', { ids: jogosDoUsuario.map((j) => j.jogoId) })
      .andWhere('partida.status IN (:...statuses)', { statuses: ['pendente', 'contestada'] })
      .orderBy('partida.criadoEm', 'DESC')
      .take(100)
      .getMany();
    return partidas;
  }

  // Ver UC-16 e RF-03.10. Roda depois de qualquer partida ser confirmada
  // (manual ou pelo job de expiração). Detecta se alguém bateu a meta de
  // vitórias da season atual e, se sim, encerra e inicia a próxima.
  private async verificarMetaSeason(jogoId: string, seasonId: string | null) {
    if (!seasonId) {
      return;
    }

    const jogo = await this.jogoRepository.findOne({ where: { id: jogoId } });
    if (!jogo?.metaVitorias) {
      return;
    }

    const contagem = await this.partidaResultadoRepository
      .createQueryBuilder('pr')
      .innerJoin('pr.partida', 'p')
      .select('pr.usuarioId', 'usuarioId')
      .addSelect('COUNT(*)', 'total')
      .where('p.seasonId = :seasonId', { seasonId })
      .andWhere('p.status = :status', { status: 'confirmada' })
      .andWhere('pr.vencedor = true')
      .groupBy('pr.usuarioId')
      .getRawMany<{ usuarioId: string; total: string }>();

    const campeao = contagem.find(
      (linha) => parseInt(linha.total, 10) >= jogo.metaVitorias!,
    );
    if (!campeao) {
      return;
    }

    const season = await this.seasonRepository.findOne({
      where: { id: seasonId },
    });
    if (!season || season.encerradaEm) {
      return; // já foi encerrada — evita corrida dupla
    }

    season.campeaoId = campeao.usuarioId;
    season.encerradaEm = new Date();
    await this.seasonRepository.save(season);

    const novaSeason = this.seasonRepository.create({
      jogoId,
      numero: season.numero + 1,
      iniciadaEm: new Date(),
    });
    await this.seasonRepository.save(novaSeason);
  }

  // Ver fase4_planejamento: "Queries de placar com índices (por jogo, por
  // season)". Em jogos sem_fim, soma tudo. Em jogos season, soma só a
  // season ativa (a que ainda não foi encerrada).
  async placar(usuarioId: string, jogoId: string) {
    const jogo = await this.jogoRepository.findOne({ where: { id: jogoId } });
    if (!jogo) {
      throw new NotFoundException('Jogo não encontrado.');
    }
    const membro = await this.jogoMembroRepository.findOne({ where: { jogoId, usuarioId } });
    if (!membro) throw new ForbiddenException('Você não é membro desse jogo.');
    const membroDaSala = await this.salaMembros.findOne({ where: { salaId: jogo.salaId, usuarioId } });
    if (!membroDaSala) throw new ForbiddenException('Você não é membro dessa sala.');

    const query = this.partidaResultadoRepository
      .createQueryBuilder('pr')
      .innerJoin('pr.partida', 'p')
      .select('pr.usuarioId', 'usuarioId')
      .addSelect('COUNT(*)', 'vitorias')
      .where('p.jogoId = :jogoId', { jogoId })
      // Pendentes aparecem no ranking imediatamente; contestadas e canceladas não contam.
      .andWhere('p.status IN (:...statuses)', { statuses: ['pendente', 'confirmada'] })
      .andWhere('pr.vencedor = true');

    if (jogo.ciclo === 'season') {
      const seasonAtiva = await this.seasonRepository.findOne({
        where: { jogoId, encerradaEm: IsNull() },
      });
      if (!seasonAtiva) {
        return [];
      }
      query.andWhere('p.seasonId = :seasonId', { seasonId: seasonAtiva.id });
    }

    const linhas = await query
      .groupBy('pr.usuarioId')
      .orderBy('vitorias', 'DESC')
      .getRawMany<{ usuarioId: string; vitorias: string }>();

    return linhas.map((linha) => ({
      usuarioId: linha.usuarioId,
      vitorias: parseInt(linha.vitorias, 10),
    }));
  }

  async placarSala(usuarioId: string, salaId: string) {
    const membros = await this.salaMembros.find({ where: { salaId } });
    if (!membros.some((membro) => membro.usuarioId === usuarioId)) {
      throw new ForbiddenException('Você não é membro dessa sala.');
    }
    const linhas = await this.partidaResultadoRepository
      .createQueryBuilder('resultado')
      .innerJoin('resultado.partida', 'partida')
      .innerJoin('partida.jogo', 'jogo')
      .select('resultado.usuarioId', 'usuarioId')
      .addSelect('COUNT(*)', 'vitorias')
      .where('jogo.salaId = :salaId', { salaId })
      .andWhere('resultado.usuarioId IN (:...ids)', { ids: membros.map((membro) => membro.usuarioId) })
      .andWhere('resultado.vencedor = true')
      .andWhere('partida.status IN (:...statuses)', { statuses: ['pendente', 'confirmada'] })
      .groupBy('resultado.usuarioId')
      .getRawMany<{ usuarioId: string; vitorias: string }>();
    return membros.map((membro) => ({
      usuarioId: membro.usuarioId,
      vitorias: Number(linhas.find((linha) => linha.usuarioId === membro.usuarioId)?.vitorias ?? 0),
    })).sort((a, b) => b.vitorias - a.vitorias);
  }

  // Chamado pelo SchedulerService a cada 5 minutos. Ver
  // fase3_arquitetura_completa, "Job automático de expiração".
  async processarExpiracoes() {
    const agora = new Date();

    const pendentesExpiradas = await this.partidaRepository.find({
      where: { status: 'pendente', expiraEm: LessThan(agora) },
    });
    for (const partida of pendentesExpiradas) {
      partida.status = 'confirmada';
      await this.partidaRepository.save(partida);
      await this.notificacaoService.criar(
        partida.registradoPor,
        'partida_confirmada',
        { jogoId: partida.jogoId, partidaId: partida.id },
      );
      await this.verificarMetaSeason(partida.jogoId, partida.seasonId);
    }

    const contestadasExpiradas = await this.partidaRepository.find({
      where: { status: 'contestada', expiraEm: LessThan(agora) },
    });
    for (const partida of contestadasExpiradas) {
      partida.status = 'cancelada';
      await this.partidaRepository.save(partida);
      await this.notificacaoService.criar(
        partida.registradoPor,
        'partida_cancelada',
        { jogoId: partida.jogoId, partidaId: partida.id },
      );
    }

    return {
      confirmadas: pendentesExpiradas.length,
      canceladas: contestadasExpiradas.length,
    };
  }
}
