import { Body, Controller, Get, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PerfilService } from './perfil.service';
import { AtualizarPerfilDto } from './dto/atualizar-perfil.dto';

interface RequestComUsuario extends Request {
  user: { id: string; apelido: string };
}

@Controller('usuarios/me')
@UseGuards(JwtAuthGuard)
export class PerfilController {
  constructor(private readonly perfilService: PerfilService) {}

  @Get()
  obter(@Req() req: RequestComUsuario) {
    return this.perfilService.obter(req.user.id);
  }

  @Patch()
  atualizar(@Req() req: RequestComUsuario, @Body() dto: AtualizarPerfilDto) {
    return this.perfilService.atualizar(req.user.id, dto);
  }

  @Post('foto')
  @UseInterceptors(FileInterceptor('foto', { limits: { fileSize: 2 * 1024 * 1024 } }))
  enviarFoto(
    @Req() req: RequestComUsuario,
    @UploadedFile() arquivo: { buffer: Buffer; mimetype: string; size: number },
  ) {
    return this.perfilService.enviarFoto(req.user.id, arquivo);
  }
}
