import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificacaoService } from './notificacao.service';

interface RequestComUsuario extends Request {
  user: { id: string; apelido: string };
}

// Módulo Notificações — ver RF-06 (fase2_requisitos_funcionais) e
// Sprint 2 (fase4_planejamento).
@Controller('notificacoes')
@UseGuards(JwtAuthGuard)
export class NotificacaoController {
  constructor(private readonly notificacaoService: NotificacaoService) {}

  @Get()
  listar(@Req() req: RequestComUsuario) {
    return this.notificacaoService.listar(req.user.id);
  }

  @Post(':id/marcar-lida')
  marcarComoLida(@Req() req: RequestComUsuario, @Param('id') id: string) {
    return this.notificacaoService.marcarComoLida(req.user.id, id);
  }
}
