import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Jogo } from './entities/jogo.entity';
import { JogoMembro } from './entities/jogo-membro.entity';
import { Season } from './entities/season.entity';
import { Sala } from '../sala/entities/sala.entity';
import { SalaMembro } from '../sala/entities/sala-membro.entity';
import { CriarJogoDto } from './dto/criar-jogo.dto';
import { AdicionarMembroJogoDto } from './dto/adicionar-membro-jogo.dto';
import { NotificacaoService } from '../notificacao/notificacao.service';

@Injectable()
export class JogoService {
  constructor(
    @InjectRepository(Jogo)
    private readonly jogoRepository: Repository<Jogo>,
    @InjectRepository(JogoMembro)
    private readonly jogoMembroRepository: Repository<JogoMembro>,
    @InjectRepository(Season)
    private readonly seasonRepository: Repository<Season>,
    @InjectRepository(Sala)
    private readonly salaRepository: Repository<Sala>,
    @InjectRepository(SalaMembro)
    private readonly salaMembroRepository: Repository<SalaMembro>,
    private readonly notificacaoService: NotificacaoService,
  ) {}

  // Ver UC-11 e RF-03.1/03.2/03.9/03.10. Só o líder da sala cria jogos.
  async criar(liderId: string, salaId: string, dto: CriarJogoDto) {
    const sala = await this.salaRepository.findOne({ where: { id: salaId } });
    if (!sala) {
      throw new NotFoundException('Sala não encontrada.');
    }
    if (sala.liderId !== liderId) {
      throw new ForbiddenException('Só o líder pode criar jogos na sala.');
    }

    const membrosUnicos = [...new Set(dto.membros)];

    const membrosDaSala = await this.salaMembroRepository.find({
      where: { salaId },
    });
    const idsDaSala = new Set(membrosDaSala.map((m) => m.usuarioId));
    const foraDaSala = membrosUnicos.filter((id) => !idsDaSala.has(id));
    if (foraDaSala.length > 0) {
      throw new BadRequestException(
        'Todos os membros selecionados precisam fazer parte da sala.',
      );
    }

    // Ver UC-11: 2 membros = Duelo (automático); 3+ = Competição ou Rei do
    // Pedaço (líder escolhe).
    let modo: Jogo['modo'];
    if (membrosUnicos.length === 2) {
      modo = 'duelo';
    } else {
      if (!dto.modo) {
        throw new BadRequestException(
          'Para jogos com 3 ou mais membros, escolha o modo: competicao ou rei_do_pedaco.',
        );
      }
      modo = dto.modo;
    }

    // Ver RF-03.10: ciclo season exige meta de vitórias.
    if (dto.ciclo === 'season' && !dto.metaVitorias) {
      throw new BadRequestException(
        'Ciclo season exige a meta de vitórias.',
      );
    }

    const jogo = this.jogoRepository.create({
      salaId,
      nome: dto.nome,
      modo,
      ciclo: dto.ciclo,
      metaVitorias: dto.ciclo === 'season' ? dto.metaVitorias! : null,
    });
    await this.jogoRepository.save(jogo);

    const agora = new Date();
    const jogoMembros = membrosUnicos.map((usuarioId) =>
      this.jogoMembroRepository.create({
        jogoId: jogo.id,
        usuarioId,
        entrouEm: agora,
      }),
    );
    await this.jogoMembroRepository.save(jogoMembros);

    // Ver RF-03.10 / fase4_planejamento: season criada automaticamente.
    if (dto.ciclo === 'season') {
      const season = this.seasonRepository.create({
        jogoId: jogo.id,
        numero: 1,
        iniciadaEm: agora,
      });
      await this.seasonRepository.save(season);
    }

    // Ver fase3_arquitetura_completa (tipo 'adicionado_jogo'). Não notifica
    // quem criou o jogo sobre a própria ação.
    await Promise.all(
      membrosUnicos
        .filter((usuarioId) => usuarioId !== liderId)
        .map((usuarioId) =>
          this.notificacaoService.criar(usuarioId, 'adicionado_jogo', {
            jogoId: jogo.id,
          }),
        ),
    );

    return jogo;
  }

  // Ver UC-12. Só o líder da sala gerencia membros do jogo. Novo membro
  // entra com zero vitórias — sem compensação retroativa (RF-03.4). Isso já
  // é natural aqui: não existe nenhuma partida ainda (Sprint 4).
  async adicionarMembro(
    liderId: string,
    jogoId: string,
    dto: AdicionarMembroJogoDto,
  ) {
    const jogo = await this.jogoRepository.findOne({ where: { id: jogoId } });
    if (!jogo) {
      throw new NotFoundException('Jogo não encontrado.');
    }

    const sala = await this.salaRepository.findOne({
      where: { id: jogo.salaId },
    });
    if (!sala || sala.liderId !== liderId) {
      throw new ForbiddenException(
        'Só o líder da sala pode adicionar membros ao jogo.',
      );
    }

    const membroDaSala = await this.salaMembroRepository.findOne({
      where: { salaId: jogo.salaId, usuarioId: dto.usuarioId },
    });
    if (!membroDaSala) {
      throw new BadRequestException(
        'O membro precisa fazer parte da sala antes de entrar no jogo.',
      );
    }

    const jaEhMembroDoJogo = await this.jogoMembroRepository.findOne({
      where: { jogoId, usuarioId: dto.usuarioId },
    });
    if (jaEhMembroDoJogo) {
      throw new ConflictException('Esse usuário já é membro desse jogo.');
    }

    const jogoMembro = this.jogoMembroRepository.create({
      jogoId,
      usuarioId: dto.usuarioId,
      entrouEm: new Date(),
    });
    await this.jogoMembroRepository.save(jogoMembro);

    await this.notificacaoService.criar(dto.usuarioId, 'adicionado_jogo', {
      jogoId,
    });

    return jogoMembro;
  }

  // Ver fase4_planejamento: "Listagem de jogos na tela da sala com líder
  // atual". O líder atual (por vitórias) depende do módulo de Partida
  // (Sprint 4) — por enquanto retorna os jogos com seus membros, sem essa
  // informação ainda.
  async listarPorSala(salaId: string) {
    const jogos = await this.jogoRepository.find({
      where: { salaId },
      order: { criadoEm: 'DESC' },
    });

    return Promise.all(
      jogos.map(async (jogo) => {
        const membros = await this.jogoMembroRepository.find({
          where: { jogoId: jogo.id },
        });
        return {
          ...jogo,
          membros: membros.map((m) => m.usuarioId),
        };
      }),
    );
  }
}
