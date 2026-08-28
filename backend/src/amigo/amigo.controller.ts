import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AmigoService } from './amigo.service';
import { SolicitarAmizadeDto } from './dto/solicitar-amizade.dto';

interface RequestComUsuario extends Request {
  user: { id: string; apelido: string };
}

// Módulo Amigos — ver UC-04 (casos_de_uso) e Sprint 2 (fase4_planejamento).
@Controller('amigos')
@UseGuards(JwtAuthGuard)
export class AmigoController {
  constructor(private readonly amigoService: AmigoService) {}

  @Get('buscar')
  buscar(@Query('apelido') apelido: string, @Req() req: RequestComUsuario) {
    return this.amigoService.buscarPorApelido(apelido, req.user.id);
  }

  @Post('solicitacoes')
  solicitar(
    @Req() req: RequestComUsuario,
    @Body() dto: SolicitarAmizadeDto,
  ) {
    return this.amigoService.solicitar(req.user.id, dto);
  }

  @Get('solicitacoes/pendentes')
  listarPendentes(@Req() req: RequestComUsuario) {
    return this.amigoService.listarPendentesRecebidas(req.user.id);
  }

  @Post('solicitacoes/:id/aceitar')
  aceitar(@Req() req: RequestComUsuario, @Param('id') id: string) {
    return this.amigoService.aceitar(req.user.id, id);
  }

  @Post('solicitacoes/:id/recusar')
  recusar(@Req() req: RequestComUsuario, @Param('id') id: string) {
    return this.amigoService.recusar(req.user.id, id);
  }

  @Get()
  listar(@Req() req: RequestComUsuario) {
    return this.amigoService.listarAmigos(req.user.id);
  }
}
