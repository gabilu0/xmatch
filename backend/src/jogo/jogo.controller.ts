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
import { JogoService } from './jogo.service';
import { CriarJogoDto } from './dto/criar-jogo.dto';
import { AdicionarMembroJogoDto } from './dto/adicionar-membro-jogo.dto';

interface RequestComUsuario extends Request {
  user: { id: string; apelido: string };
}

// Módulo Jogo — ver UC-11, UC-12 e Sprint 3 (fase4_planejamento). Sem
// prefixo fixo no @Controller() porque as rotas vivem em dois "namespaces"
// diferentes: /salas/:salaId/jogos (criar/listar) e /jogos/:id (ações do
// próprio jogo, como adicionar membro).
@Controller()
@UseGuards(JwtAuthGuard)
export class JogoController {
  constructor(private readonly jogoService: JogoService) {}

  @Post('salas/:salaId/jogos')
  criar(
    @Req() req: RequestComUsuario,
    @Param('salaId') salaId: string,
    @Body() dto: CriarJogoDto,
  ) {
    return this.jogoService.criar(req.user.id, salaId, dto);
  }

  @Get('salas/:salaId/jogos')
  listar(@Param('salaId') salaId: string) {
    return this.jogoService.listarPorSala(salaId);
  }

  @Post('jogos/:id/membros')
  adicionarMembro(
    @Req() req: RequestComUsuario,
    @Param('id') id: string,
    @Body() dto: AdicionarMembroJogoDto,
  ) {
    return this.jogoService.adicionarMembro(req.user.id, id, dto);
  }
}
