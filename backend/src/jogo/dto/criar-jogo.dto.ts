import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

// Ver UC-11 (casos_de_uso) e Sprint 3 (fase4_planejamento).
// A validação cruzada (modo obrigatório conforme nº de membros, metaVitorias
// obrigatória conforme ciclo) fica no JogoService — são regras condicionais
// demais para decorators simples.
export class CriarJogoDto {
  @IsString()
  @Length(1, 50)
  nome: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsUUID('4', { each: true })
  membros: string[];

  @IsOptional()
  @IsIn(['competicao', 'rei_do_pedaco'])
  modo?: 'competicao' | 'rei_do_pedaco';

  @IsIn(['sem_fim', 'season'])
  ciclo: 'sem_fim' | 'season';

  @IsOptional()
  @IsInt()
  @Min(1)
  metaVitorias?: number;
}
