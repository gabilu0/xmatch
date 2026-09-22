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
import { PartidaService } from './partida.service';
import { RegistrarVitoriaDto } from './dto/registrar-vitoria.dto';

interface RequestComUsuario extends Request {
  user: { id: string; apelido: string };
}

// Módulo Partida — ver UC-13, UC-14, UC-15 e Sprint 4 (fase4_planejamento).
@Controller()
@UseGuards(JwtAuthGuard)
export class PartidaController {
  constructor(private readonly partidaService: PartidaService) {}

  @Post('jogos/:jogoId/partidas')
  registrarVitoria(
    @Req() req: RequestComUsuario,
    @Param('jogoId') jogoId: string,
    @Body() dto: RegistrarVitoriaDto,
  ) {
    return this.partidaService.registrarVitoria(req.user.id, jogoId, dto);
  }

  @Get('jogos/:jogoId/partidas')
  listarPorJogo(@Req() req: RequestComUsuario, @Param('jogoId') jogoId: string) {
    return this.partidaService.listarPorJogo(req.user.id, jogoId);
  }

  @Get('partidas/pendentes')
  listarPendentes(@Req() req: RequestComUsuario) {
    return this.partidaService.listarPendentes(req.user.id);
  }

  @Get('jogos/:jogoId/placar')
  placar(@Req() req: RequestComUsuario, @Param('jogoId') jogoId: string) {
    return this.partidaService.placar(req.user.id, jogoId);
  }

  @Get('salas/:salaId/placar')
  placarSala(@Req() req: RequestComUsuario, @Param('salaId') salaId: string) {
    return this.partidaService.placarSala(req.user.id, salaId);
  }

  @Post('partidas/:id/contestar')
  contestar(@Req() req: RequestComUsuario, @Param('id') id: string) {
    return this.partidaService.contestar(req.user.id, id);
  }

  @Post('partidas/:id/confirmar')
  confirmar(@Req() req: RequestComUsuario, @Param('id') id: string) {
    return this.partidaService.confirmar(req.user.id, id);
  }

  @Post('partidas/:id/cancelar')
  cancelar(@Req() req: RequestComUsuario, @Param('id') id: string) {
    return this.partidaService.cancelar(req.user.id, id);
  }
}
