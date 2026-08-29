import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sala } from './entities/sala.entity';
import { SalaMembro } from './entities/sala-membro.entity';
import { Convite } from './entities/convite.entity';
import { SalaController } from './sala.controller';
import { SalaService } from './sala.service';

@Module({
  imports: [TypeOrmModule.forFeature([Sala, SalaMembro, Convite])],
  controllers: [SalaController],
  providers: [SalaService],
  exports: [TypeOrmModule],
})
export class SalaModule {}
