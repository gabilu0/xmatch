import { IsIn, IsNotEmpty, IsString } from 'class-validator';

// Ver POST /dispositivos — fase4_planejamento (Sprint 1) e
// fase3_arquitetura_completa, Parte 3 (Fluxo de notificação FCM).
export class RegistrarDispositivoDto {
  @IsString()
  @IsNotEmpty()
  fcmToken: string;

  @IsIn(['android', 'ios', 'web'])
  plataforma: 'android' | 'ios' | 'web';
}
