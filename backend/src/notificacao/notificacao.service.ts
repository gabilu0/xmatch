import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { Notificacao } from './entities/notificacao.entity';
import { UsuarioDispositivo } from '../usuario/entities/usuario-dispositivo.entity';

// Tipos suportados até o Sprint 4 — ver fase3_arquitetura_completa, Parte 2.
export type TipoNotificacao =
  | 'adicionado_sala'
  | 'sala_encerrada'
  | 'lideranca_transferida'
  | 'adicionado_jogo'
  | 'vitoria_registrada'
  | 'partida_contestada'
  | 'partida_confirmada'
  | 'partida_cancelada';

@Injectable()
export class NotificacaoService {
  private readonly logger = new Logger(NotificacaoService.name);

  constructor(
    @InjectRepository(Notificacao)
    private readonly notificacaoRepository: Repository<Notificacao>,
    @InjectRepository(UsuarioDispositivo)
    private readonly dispositivos: Repository<UsuarioDispositivo>,
  ) {}

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
    const salvo = await this.notificacaoRepository.save(notificacao);
    await this.enviarPush(usuarioId, tipo, opcoes);
    return salvo;
  }

  private async enviarPush(usuarioId: string, tipo: TipoNotificacao, opcoes: { salaId?: string; partidaId?: string; jogoId?: string }) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!projectId || !clientEmail || !privateKey) return;
    try {
      if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, '\n') }) });
      const dispositivos = await this.dispositivos.find({ where: { usuarioId } });
      if (!dispositivos.length) return;
      const url = opcoes.jogoId && opcoes.salaId
        ? `/salas/${opcoes.salaId}/jogos/${opcoes.jogoId}`
        : opcoes.salaId ? `/salas/${opcoes.salaId}` : '/salas';
      const titulos: Record<TipoNotificacao, string> = {
        adicionado_sala: 'Você entrou em uma sala', sala_encerrada: 'Sala encerrada',
        lideranca_transferida: 'Você é o novo líder', adicionado_jogo: 'Você entrou em um jogo',
        vitoria_registrada: 'Nova vitória registrada', partida_contestada: 'Partida contestada',
        partida_confirmada: 'Partida confirmada', partida_cancelada: 'Partida cancelada',
      };
      for (let indice = 0; indice < dispositivos.length; indice += 500) {
        const lote = dispositivos.slice(indice, indice + 500);
        const resposta = await getMessaging().sendEachForMulticast({
          tokens: lote.map((dispositivo) => dispositivo.fcmToken),
          data: { title: titulos[tipo], body: 'Confira as novidades no xMatch.', url },
        });
        for (const [posicao, item] of resposta.responses.entries()) {
          if (item.error && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(item.error.code)) {
            await this.dispositivos.remove(lote[posicao]);
          }
        }
      }
    } catch (erro) {
      // A persistência da notificação e a operação principal não dependem do FCM.
      this.logger.warn(`Falha ao enviar notificação push: ${erro instanceof Error ? erro.message : 'erro desconhecido'}`);
    }
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
