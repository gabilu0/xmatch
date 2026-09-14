import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { PartidaModule } from '../partida/partida.module';

@Module({
  imports: [PartidaModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
