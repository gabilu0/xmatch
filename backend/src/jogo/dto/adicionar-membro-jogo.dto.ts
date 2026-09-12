import { IsUUID } from 'class-validator';

// Ver UC-12 (casos_de_uso).
export class AdicionarMembroJogoDto {
  @IsUUID()
  usuarioId: string;
}
