import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Amizade } from './entities/amizade.entity';
import { Usuario } from '../usuario/entities/usuario.entity';
import { Sala } from '../sala/entities/sala.entity';
import { SalaMembro } from '../sala/entities/sala-membro.entity';
import { AmigoController } from './amigo.controller';
import { AmigoService } from './amigo.service';

@Module({
  imports: [TypeOrmModule.forFeature([Amizade, Usuario, Sala, SalaMembro])],
  controllers: [AmigoController],
  providers: [AmigoService],
})
export class AmigoModule {}
