import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sala } from './entities/sala.entity';
import { SalaMembro } from './entities/sala-membro.entity';
import { Convite } from './entities/convite.entity';
import { Jogo } from '../jogo/entities/jogo.entity';
import { JogoMembro } from '../jogo/entities/jogo-membro.entity';
import { SalaController } from './sala.controller';
import { SalaService } from './sala.service';
import { NotificacaoModule } from '../notificacao/notificacao.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sala, SalaMembro, Convite, Jogo, JogoMembro]),
    NotificacaoModule,
  ],
  controllers: [SalaController],
  providers: [SalaService],
  exports: [TypeOrmModule],
})
export class SalaModule {}
