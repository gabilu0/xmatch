import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Guard usado em GET /auth/google e GET /auth/google/callback — ver RF-01.2.
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
