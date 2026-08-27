import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RegistrarDispositivoDto } from './dto/registrar-dispositivo.dto';
import { DispositivoService } from './dispositivo.service';

interface RequestComUsuario extends Request {
  user: { id: string; apelido: string };
}

// POST /dispositivos — Sprint 1 (fase4_planejamento). Protegido por JWT:
// o dispositivo é sempre vinculado ao usuário autenticado, nunca informado
// no corpo da requisição.
@Controller('dispositivos')
@UseGuards(JwtAuthGuard)
export class DispositivoController {
  constructor(private readonly dispositivoService: DispositivoService) {}

  @Post()
  registrar(
    @Req() req: RequestComUsuario,
    @Body() dto: RegistrarDispositivoDto,
  ) {
    return this.dispositivoService.registrar(req.user.id, dto);
  }
}
