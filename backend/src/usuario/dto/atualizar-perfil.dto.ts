import { IsString, Length } from 'class-validator';

export class AtualizarPerfilDto {
  @IsString()
  @Length(3, 30)
  apelido: string;
}
