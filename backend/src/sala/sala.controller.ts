import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SalaService } from './sala.service';
import { CriarSalaDto } from './dto/criar-sala.dto';
import { EntrarSalaDto } from './dto/entrar-sala.dto';

interface RequestComUsuario extends Request {
  user: { id: string; apelido: string };
}

// Módulo Sala — ver UC-05, UC-06 e Sprint 2 (fase4_planejamento).
@Controller('salas')
@UseGuards(JwtAuthGuard)
export class SalaController {
  constructor(private readonly salaService: SalaService) {}

  @Post()
  criar(@Req() req: RequestComUsuario, @Body() dto: CriarSalaDto) {
    return this.salaService.criar(req.user.id, dto);
  }

  @Get()
  listar(@Req() req: RequestComUsuario) {
    return this.salaService.listarDoUsuario(req.user.id);
  }

  @Post(':id/convites')
  gerarConvite(@Req() req: RequestComUsuario, @Param('id') id: string) {
    return this.salaService.gerarConvite(req.user.id, id);
  }
  
  @Post(':id/expulsar')
  expulsar(@Req() req: RequestComUsuario, @Param('id') id: string) {
    return this.salaService.expulsar(req.user.id, id);
  }

  @Post('entrar')
  entrar(@Req() req: RequestComUsuario, @Body() dto: EntrarSalaDto) {
    return this.salaService.entrarComCodigo(req.user.id, dto);
  }
  @Post(':id/sair')
  sair(@Req() req: RequestComUsuario, @Param('id') id: string) {
    return this.salaService.sair(req.user.id, id);
  }

  excluirSala(@Req() req: RequestComUsuario, @Param('id') id: string) {
    return this.salaService.excluir(req.user.id, id);
  }
}
