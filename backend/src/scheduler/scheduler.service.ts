import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PartidaService } from '../partida/partida.service';

// Ver fase3_arquitetura_completa, "Job automático de expiração", e
// fase4_planejamento (Sprint 4): job a cada 5min, confirma pendentes
// expiradas e cancela contestadas expiradas.
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly partidaService: PartidaService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async processarExpiracoesDePartidas() {
    const resultado = await this.partidaService.processarExpiracoes();
    if (resultado.confirmadas > 0 || resultado.canceladas > 0) {
      this.logger.log(
        `Expiração processada: ${resultado.confirmadas} confirmada(s), ${resultado.canceladas} cancelada(s).`,
      );
    }
  }
}
