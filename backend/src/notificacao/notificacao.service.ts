import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacao } from './entities/notificacao.entity';

// Tipos suportados até o Sprint 3 — ver fase3_arquitetura_completa, Parte 2.
export type TipoNotificacao =
  | 'adicionado_sala'
  | 'sala_encerrada'
  | 'lideranca_transferida'
  | 'adicionado_jogo';

@Injectable()
export class NotificacaoService {
  constructor(
    @InjectRepository(Notificacao)
    private readonly notificacaoRepository: Repository<Notificacao>,
  ) {}

  // Cria o registro em `notificacao`. Não faz envio via FCM ainda — isso
  // depende do firebase-admin e das credenciais do Firebase, que ainda não
  // foram configuradas (mesma situação do Cloudinary: integração externa
  // pendente, tratada à parte). Por enquanto, é o "histórico"/"centro de
  // notificações" descrito na RF-06.
  async criar(
    usuarioId: string,
    tipo: TipoNotificacao,
    opcoes: { salaId?: string; partidaId?: string; jogoId?: string } = {},
  ) {
    const notificacao = this.notificacaoRepository.create({
      usuarioId,
      tipo,
      salaId: opcoes.salaId ?? null,
      partidaId: opcoes.partidaId ?? null,
      jogoId: opcoes.jogoId ?? null,
    });
    return this.notificacaoRepository.save(notificacao);
  }

  async listar(usuarioId: string) {
    return this.notificacaoRepository.find({
      where: { usuarioId },
      order: { criadoEm: 'DESC' },
    });
  }

  async marcarComoLida(usuarioId: string, notificacaoId: string) {
    const notificacao = await this.notificacaoRepository.findOne({
      where: { id: notificacaoId },
    });
    if (!notificacao) {
      throw new NotFoundException('Notificação não encontrada.');
    }
    if (notificacao.usuarioId !== usuarioId) {
      throw new ForbiddenException(
        'Você não pode marcar a notificação de outra pessoa.',
      );
    }

    notificacao.lida = true;
    return this.notificacaoRepository.save(notificacao);
  }
}
