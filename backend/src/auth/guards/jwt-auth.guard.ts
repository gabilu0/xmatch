import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Guard usado para proteger rotas — ver RF-01 / Sprint 1 (fase4_planejamento).
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
