import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

// Dados extraídos do perfil Google, repassados para AuthService.loginComGoogle.
// Ver RF-01.2 (fase2_requisitos_funcionais) e fluxo de autenticação
// (fase3_arquitetura_completa, Parte 3).
export interface GoogleProfilePayload {
  googleId: string;
  email: string | null;
  nomeSugerido: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ??
        'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value ?? null;
    const nomeSugerido =
      profile.displayName ?? profile.name?.givenName ?? 'usuario';

    const payload: GoogleProfilePayload = {
      googleId: profile.id,
      email,
      nomeSugerido,
    };

    done(null, payload);
  }
}
