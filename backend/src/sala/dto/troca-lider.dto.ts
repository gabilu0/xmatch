import { IsUUID } from 'class-validator';

// Ver UC-09 (casos_de_uso).
export class TrocaLiderDto {
  @IsUUID()
  novoLiderId: string;
}
