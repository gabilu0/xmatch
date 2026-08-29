import { IsOptional, IsString, IsUrl, Length } from 'class-validator';

// Ver UC-05 e RF-02.1/RF-02.2 (casos_de_uso / fase2_requisitos_funcionais).
// fotoUrl é opcional — upload real via Cloudinary ainda não implementado;
// por enquanto aceita uma URL já hospedada, se o cliente enviar uma.
// Nulo = avatar gerado pelas iniciais no frontend (mesmo padrão do usuario).
export class CriarSalaDto {
  @IsString()
  @Length(1, 50)
  nome: string;

  @IsOptional()
  @IsUrl()
  fotoUrl?: string;
}
