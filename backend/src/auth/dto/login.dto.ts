import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  apelido: string;

  @IsString()
  senha: string;
}
