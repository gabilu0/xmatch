import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Partida } from './entities/partida.entity';
import { PartidaResultado } from './entities/partida-resultado.entity';
import { Jogo } from '../jogo/entities/jogo.entity';
import { JogoMembro } from '../jogo/entities/jogo-membro.entity';
import { Season } from '../jogo/entities/season.entity';
import { PartidaController } from './partida.controller';
import { PartidaService } from './partida.service';
import { NotificacaoModule } from '../notificacao/notificacao.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Partida,
      PartidaResultado,
      Jogo,
      JogoMembro,
      Season,
    ]),
    NotificacaoModule,
  ],
  controllers: [PartidaController],
  providers: [PartidaService],
  exports: [PartidaService],
})
export class PartidaModule {}
