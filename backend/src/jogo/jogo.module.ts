import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Jogo } from './entities/jogo.entity';
import { JogoMembro } from './entities/jogo-membro.entity';
import { Season } from './entities/season.entity';
import { Sala } from '../sala/entities/sala.entity';
import { SalaMembro } from '../sala/entities/sala-membro.entity';
import { JogoController } from './jogo.controller';
import { JogoService } from './jogo.service';
import { NotificacaoModule } from '../notificacao/notificacao.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Jogo, JogoMembro, Season, Sala, SalaMembro]),
    NotificacaoModule,
  ],
  controllers: [JogoController],
  providers: [JogoService],
})
export class JogoModule {}
