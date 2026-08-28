import { IsString, Length } from 'class-validator';

// Ver UC-04 (casos_de_uso).
export class SolicitarAmizadeDto {
  @IsString()
  @Length(3, 30)
  apelido: string;
}
