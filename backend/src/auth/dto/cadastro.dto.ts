import { IsEmail, IsString, Length } from 'class-validator';

export class CadastroDto {
  @IsString()
  @Length(3, 30)
  apelido: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 72)
  senha: string;
}
