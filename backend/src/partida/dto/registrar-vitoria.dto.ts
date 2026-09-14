import { IsOptional, IsUUID } from 'class-validator';

// Ver UC-13/UC-14 (casos_de_uso). perdedorId só é usado (e obrigatório) no
// modo 'rei_do_pedaco' — a validação condicional fica no PartidaService.
export class RegistrarVitoriaDto {
  @IsOptional()
  @IsUUID()
  perdedorId?: string;
}
