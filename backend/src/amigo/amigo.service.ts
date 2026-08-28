import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Amizade } from './entities/amizade.entity';
import { Usuario } from '../usuario/entities/usuario.entity';
import { SalaMembro } from '../sala/entities/sala-membro.entity';
import { SolicitarAmizadeDto } from './dto/solicitar-amizade.dto';

@Injectable()
export class AmigoService {
  constructor(
    @InjectRepository(Amizade)
    private readonly amizadeRepository: Repository<Amizade>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(SalaMembro)
    private readonly salaMembroRepository: Repository<SalaMembro>,
  ) {}

  // Ver UC-04 — exceção: apelido não encontrado.
  async buscarPorApelido(apelido: string, usuarioLogadoId: string) {
    const usuario = await this.usuarioRepository.findOne({
      where: { apelido },
    });
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return {
      id: usuario.id,
      apelido: usuario.apelido,
      fotoUrl: usuario.fotoUrl,
      salasEmComum: await this.contarSalasEmComum(usuarioLogadoId, usuario.id),
    };
  }

  // Ver UC-04. Regra de bloqueio bidirecional (decisão de produto): se já
  // existe um pedido pendente entre os dois, em qualquer direção, não cria
  // outro — quem recebeu só pode aceitar ou recusar o que já existe.
  async solicitar(solicitanteId: string, dto: SolicitarAmizadeDto) {
    const destinatario = await this.usuarioRepository.findOne({
      where: { apelido: dto.apelido },
    });
    if (!destinatario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (destinatario.id === solicitanteId) {
      throw new ConflictException('Você não pode adicionar a si mesmo.');
    }

    const existente = await this.amizadeRepository
      .createQueryBuilder('amizade')
      .where(
        '(amizade.solicitanteId = :a AND amizade.destinatarioId = :b) OR (amizade.solicitanteId = :b AND amizade.destinatarioId = :a)',
        { a: solicitanteId, b: destinatario.id },
      )
      .getOne();

    if (existente) {
      if (existente.status === 'aceita') {
        throw new ConflictException('Vocês já são amigos.');
      }
      if (existente.solicitanteId === solicitanteId) {
        throw new ConflictException('Solicitação já enviada.');
      }
      throw new ConflictException(
        `${destinatario.apelido} já te enviou uma solicitação. Aceite ou recuse em vez de enviar outra.`,
      );
    }

    const amizade = this.amizadeRepository.create({
      solicitanteId,
      destinatarioId: destinatario.id,
      status: 'pendente',
    });
    await this.amizadeRepository.save(amizade);

    return amizade;
  }

  async listarPendentesRecebidas(usuarioId: string) {
    const pendentes = await this.amizadeRepository.find({
      where: { destinatarioId: usuarioId, status: 'pendente' },
      relations: ['solicitante'],
      order: { criadoEm: 'DESC' },
    });

    // Nunca expor a entity Usuario inteira aqui — ela carrega senha_hash,
    // google_id e email, que não têm nada a ver com essa tela.
    return pendentes.map((amizade) => ({
      id: amizade.id,
      criadoEm: amizade.criadoEm,
      solicitante: {
        id: amizade.solicitante.id,
        apelido: amizade.solicitante.apelido,
        fotoUrl: amizade.solicitante.fotoUrl,
      },
    }));
  }

  // Só quem recebeu o pedido pode aceitar.
  async aceitar(usuarioId: string, amizadeId: string) {
    const amizade = await this.amizadeRepository.findOne({
      where: { id: amizadeId },
    });
    if (!amizade || amizade.status !== 'pendente') {
      throw new NotFoundException('Solicitação não encontrada.');
    }
    if (amizade.destinatarioId !== usuarioId) {
      throw new ForbiddenException(
        'Você não pode responder a esta solicitação.',
      );
    }

    amizade.status = 'aceita';
    await this.amizadeRepository.save(amizade);
    return amizade;
  }

  // Só quem recebeu o pedido pode recusar. Recusa remove a linha (UC-04),
  // permitindo uma nova solicitação futura.
  async recusar(usuarioId: string, amizadeId: string) {
    const amizade = await this.amizadeRepository.findOne({
      where: { id: amizadeId },
    });
    if (!amizade || amizade.status !== 'pendente') {
      throw new NotFoundException('Solicitação não encontrada.');
    }
    if (amizade.destinatarioId !== usuarioId) {
      throw new ForbiddenException(
        'Você não pode responder a esta solicitação.',
      );
    }

    await this.amizadeRepository.remove(amizade);
    return { removido: true };
  }

  // Lista amigos confirmados, com número de salas em comum (UC-04).
  async listarAmigos(usuarioId: string) {
    const amizades = await this.amizadeRepository
      .createQueryBuilder('amizade')
      .where(
        '(amizade.solicitanteId = :id OR amizade.destinatarioId = :id) AND amizade.status = :status',
        { id: usuarioId, status: 'aceita' },
      )
      .leftJoinAndSelect('amizade.solicitante', 'solicitante')
      .leftJoinAndSelect('amizade.destinatario', 'destinatario')
      .getMany();

    return Promise.all(
      amizades.map(async (amizade) => {
        const amigo =
          amizade.solicitanteId === usuarioId
            ? amizade.destinatario
            : amizade.solicitante;

        return {
          id: amigo.id,
          apelido: amigo.apelido,
          fotoUrl: amigo.fotoUrl,
          salasEmComum: await this.contarSalasEmComum(usuarioId, amigo.id),
        };
      }),
    );
  }

  private async contarSalasEmComum(
    usuarioAId: string,
    usuarioBId: string,
  ): Promise<number> {
    return this.salaMembroRepository
      .createQueryBuilder('sm_a')
      .innerJoin(SalaMembro, 'sm_b', 'sm_a.salaId = sm_b.salaId')
      .where('sm_a.usuarioId = :a', { a: usuarioAId })
      .andWhere('sm_b.usuarioId = :b', { b: usuarioBId })
      .getCount();
  }
}
