import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sala } from './entities/sala.entity';
import { SalaMembro } from './entities/sala-membro.entity';
import { Convite } from './entities/convite.entity';
import { CriarSalaDto } from './dto/criar-sala.dto';
import { EntrarSalaDto } from './dto/entrar-sala.dto';
import { TrocaLiderDto } from './dto/troca-lider.dto';
import { NotificacaoService } from '../notificacao/notificacao.service';

@Injectable()
export class SalaService {
  constructor(
    @InjectRepository(Sala)
    private readonly salaRepository: Repository<Sala>,
    @InjectRepository(SalaMembro)
    private readonly salaMembroRepository: Repository<SalaMembro>,
    @InjectRepository(Convite)
    private readonly conviteRepository: Repository<Convite>,
    private readonly notificacaoService: NotificacaoService,
  ) {}

  // Ver UC-05 e RF-02.1/RF-02.3. Quem cria a sala torna-se líder
  // automaticamente e já entra como membro dela.
  async criar(liderId: string, dto: CriarSalaDto) {
    const sala = this.salaRepository.create({
      liderId,
      nome: dto.nome,
      fotoUrl: dto.fotoUrl ?? null,
    });
    await this.salaRepository.save(sala);

    const membro = this.salaMembroRepository.create({
      salaId: sala.id,
      usuarioId: liderId,
      entrouEm: new Date(),
    });
    await this.salaMembroRepository.save(membro);

    return sala;
  }

  // Ver RF-02.10 / UC-05 ("sala aparece na tela principal do Líder").
  // Lista as salas em que o usuário é membro (líder ou não).
  async listarDoUsuario(usuarioId: string) {
    return this.salaRepository
      .createQueryBuilder('sala')
      .innerJoin(
        SalaMembro,
        'membro',
        'membro.salaId = sala.id AND membro.usuarioId = :usuarioId',
        { usuarioId },
      )
      .orderBy('sala.criadoEm', 'DESC')
      .getMany();
  }

  // Ver UC-06 e RF-02.5. Só o líder pode gerar convites. Expira em 48h ou
  // após 1 uso, o que ocorrer primeiro.
  async gerarConvite(liderId: string, salaId: string) {
    const sala = await this.salaRepository.findOne({ where: { id: salaId } });
    if (!sala) {
      throw new NotFoundException('Sala não encontrada.');
    }
    if (sala.liderId !== liderId) {
      throw new ForbiddenException('Só o líder pode gerar convites.');
    }

    const codigo = await this.gerarCodigoUnico();
    const expiraEm = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

    const convite = this.conviteRepository.create({
      salaId,
      criadoPor: liderId,
      codigo,
      usado: false,
      expiraEm,
    });
    await this.conviteRepository.save(convite);

    return convite;
  }

  // Ver UC-06. Exceções: convite inválido, já usado, expirado, ou usuário
  // já é membro da sala.
  async entrarComCodigo(usuarioId: string, dto: EntrarSalaDto) {
    const convite = await this.conviteRepository.findOne({
      where: { codigo: dto.codigo },
    });
    if (!convite) {
      throw new NotFoundException('Convite não encontrado.');
    }
    if (convite.usado) {
      throw new ConflictException('Convite já foi utilizado.');
    }
    if (convite.expiraEm.getTime() < Date.now()) {
      throw new ConflictException('Convite expirado.');
    }

    const jaEhMembro = await this.salaMembroRepository.findOne({
      where: { salaId: convite.salaId, usuarioId },
    });
    if (jaEhMembro) {
      throw new ConflictException('Você já é membro dessa sala.');
    }

    const membro = this.salaMembroRepository.create({
      salaId: convite.salaId,
      usuarioId,
      entrouEm: new Date(),
    });
    await this.salaMembroRepository.save(membro);

    convite.usado = true;
    await this.conviteRepository.save(convite);

    await this.notificacaoService.criar(usuarioId, 'adicionado_sala', {
      salaId: convite.salaId,
    });

    return this.salaRepository.findOne({ where: { id: convite.salaId } });
  }

  // Ver UC-07. Só o líder expulsa, e não pode se auto-expulsar.
  // NOTA DE ESCOPO: a UC-07 também prevê remover o membro dos jogos da
  // sala — isso fica pendente até o Módulo Jogo existir (Sprint 3).
  async expulsar(liderId: string, salaId: string, usuarioAlvoId: string) {
    const sala = await this.salaRepository.findOne({ where: { id: salaId } });
    if (!sala) {
      throw new NotFoundException('Sala não encontrada.');
    }
    if (sala.liderId !== liderId) {
      throw new ForbiddenException('Só o líder pode expulsar membros.');
    }
    if (usuarioAlvoId === liderId) {
      throw new ConflictException('Líder não pode se auto-expulsar.');
    }

    const membro = await this.salaMembroRepository.findOne({
      where: { salaId, usuarioId: usuarioAlvoId },
    });
    if (!membro) {
      throw new NotFoundException('Esse usuário não é membro dessa sala.');
    }

    await this.salaMembroRepository.remove(membro);
    return { removido: true };
  }

  // Ver UC-08. Líder precisa transferir a liderança antes de sair.
  async sair(usuarioId: string, salaId: string) {
    const sala = await this.salaRepository.findOne({ where: { id: salaId } });
    if (!sala) {
      throw new NotFoundException('Sala não encontrada.');
    }
    if (sala.liderId === usuarioId) {
      throw new ConflictException(
        'Você é o líder — transfira a liderança antes de sair.',
      );
    }

    const membro = await this.salaMembroRepository.findOne({
      where: { salaId, usuarioId },
    });
    if (!membro) {
      throw new NotFoundException('Você não é membro dessa sala.');
    }

    await this.salaMembroRepository.remove(membro);
    return { removido: true };
  }

  // Ver UC-10 e RF-02.9/RF-02.10. Encerrar ≠ excluir: os dados continuam
  // existindo, a sala fica em modo somente leitura por 30 dias a partir de
  // encerrada_em. Não existe rota de exclusão física — não há requisito
  // que peça isso, e contradiria a RF-02.10.
  async encerrar(liderId: string, salaId: string) {
    const sala = await this.salaRepository.findOne({ where: { id: salaId } });
    if (!sala) {
      throw new NotFoundException('Sala não encontrada.');
    }
    if (sala.liderId !== liderId) {
      throw new ForbiddenException('Só o líder pode encerrar a sala.');
    }
    if (sala.encerrada) {
      throw new ConflictException('Essa sala já está encerrada.');
    }

    sala.encerrada = true;
    sala.encerradaEm = new Date();
    await this.salaRepository.save(sala);

    const membros = await this.salaMembroRepository.find({
      where: { salaId },
    });
    await Promise.all(
      membros
        .filter((membro) => membro.usuarioId !== liderId)
        .map((membro) =>
          this.notificacaoService.criar(membro.usuarioId, 'sala_encerrada', {
            salaId,
          }),
        ),
    );

    return sala;
  }

  // Ver UC-09. Só o líder atual transfere, e só para quem já é membro.
  async transferirLideranca(
    liderId: string,
    salaId: string,
    dto: TrocaLiderDto,
  ) {
    const sala = await this.salaRepository.findOne({ where: { id: salaId } });
    if (!sala) {
      throw new NotFoundException('Sala não encontrada.');
    }
    if (sala.liderId !== liderId) {
      throw new ForbiddenException('Só o líder pode transferir a liderança.');
    }
    if (dto.novoLiderId === liderId) {
      throw new ConflictException('Você já é o líder dessa sala.');
    }

    const novoLiderEhMembro = await this.salaMembroRepository.findOne({
      where: { salaId, usuarioId: dto.novoLiderId },
    });
    if (!novoLiderEhMembro) {
      throw new NotFoundException(
        'O novo líder precisa já ser membro da sala.',
      );
    }

    sala.liderId = dto.novoLiderId;
    await this.salaRepository.save(sala);

    await this.notificacaoService.criar(
      dto.novoLiderId,
      'lideranca_transferida',
      { salaId },
    );

    return sala;
  }

  private async gerarCodigoUnico(): Promise<string> {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem O/0/I/1 (confusos)
    let tentativas = 0;

    while (tentativas < 5) {
      let codigo = '';
      for (let i = 0; i < 6; i++) {
        codigo += caracteres[Math.floor(Math.random() * caracteres.length)];
      }

      const existente = await this.conviteRepository.findOne({
        where: { codigo },
      });
      if (!existente) {
        return codigo;
      }
      tentativas += 1;
    }

    throw new ConflictException(
      'Não foi possível gerar um código de convite único. Tente novamente.',
    );
  }
}
