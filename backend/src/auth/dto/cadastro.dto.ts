import { IsString, Length } from 'class-validator';

export class CadastroDto {
  @IsString()
  @Length(3, 30)
  apelido: string;

  @IsString()
  @Length(6, 72)
  senha: string;
}
