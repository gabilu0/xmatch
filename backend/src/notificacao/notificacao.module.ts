import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notificacao } from './entities/notificacao.entity';
import { Usuario } from '../usuario/entities/usuario.entity';
import { Sala } from '../sala/entities/sala.entity';
import { NotificacaoController } from './notificacao.controller';
import { NotificacaoService } from './notificacao.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notificacao, Usuario, Sala])],
  controllers: [NotificacaoController],
  providers: [NotificacaoService],
  exports: [NotificacaoService],
})
export class NotificacaoModule {}
