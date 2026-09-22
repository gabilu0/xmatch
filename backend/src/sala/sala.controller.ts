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
import { TrocaLiderDto } from './dto/troca-lider.dto';

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

  @Get(':id')
  detalhar(@Req() req: RequestComUsuario, @Param('id') id: string) {
    return this.salaService.detalhar(req.user.id, id);
  }

  @Post(':id/convites')
  gerarConvite(@Req() req: RequestComUsuario, @Param('id') id: string) {
    return this.salaService.gerarConvite(req.user.id, id);
  }

  @Post('entrar')
  entrar(@Req() req: RequestComUsuario, @Body() dto: EntrarSalaDto) {
    return this.salaService.entrarComCodigo(req.user.id, dto);
  }

  @Post(':id/membros/:usuarioId/expulsar')
  expulsar(
    @Req() req: RequestComUsuario,
    @Param('id') id: string,
    @Param('usuarioId') usuarioId: string,
  ) {
    return this.salaService.expulsar(req.user.id, id, usuarioId);
  }

  @Post(':id/sair')
  sair(@Req() req: RequestComUsuario, @Param('id') id: string) {
    return this.salaService.sair(req.user.id, id);
  }

  @Post(':id/encerrar')
  encerrar(@Req() req: RequestComUsuario, @Param('id') id: string) {
    return this.salaService.encerrar(req.user.id, id);
  }

  @Post(':id/transferir-lideranca')
  transferirLideranca(
    @Req() req: RequestComUsuario,
    @Param('id') id: string,
    @Body() dto: TrocaLiderDto,
  ) {
    return this.salaService.transferirLideranca(req.user.id, id, dto);
  }
}
