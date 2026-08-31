import { IsString, Length } from 'class-validator';

// Ver UC-06 (casos_de_uso).
export class EntrarSalaDto {
  @IsString()
  @Length(6, 8)
  codigo: string;
}
