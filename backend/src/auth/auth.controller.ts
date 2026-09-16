import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CadastroDto } from './dto/cadastro.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleProfilePayload } from './strategies/google.strategy';

// Endpoints do Sprint 1 — ver fase4_planejamento.
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('cadastro')
  cadastrar(@Body() dto: CadastroDto) {
    return this.authService.cadastrar(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Dispara o redirecionamento para a tela de consentimento do Google.
  // O guard intercepta a requisição antes do corpo do método rodar.
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {}

  // Callback chamado pelo Google após o consentimento. O GoogleAuthGuard
  // popula req.user com o payload retornado por GoogleStrategy.validate.
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: Request & { user: GoogleProfilePayload },
    @Res() res: Response,
  ) {
    const autenticacao = await this.authService.loginComGoogle(req.user);
    const frontendUrl = process.env.FRONTEND_URL?.trim();

    // Preserva o retorno JSON atual enquanto o frontend ainda não estiver
    // publicado/configurado no ambiente do backend.
    if (!frontendUrl) {
      return res.json(autenticacao);
    }

    const callbackUrl = new URL('/auth/callback', frontendUrl);
    callbackUrl.hash = new URLSearchParams({
      token: autenticacao.accessToken,
    }).toString();

    return res.redirect(callbackUrl.toString());
  }
}
