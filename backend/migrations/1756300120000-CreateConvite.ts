import { MigrationInterface, QueryRunner } from 'typeorm';

// Cria a tabela `convite`. Depende de `sala` e `usuario` já existirem.
// Ver fase3_arquitetura_completa, Parte 2, e UC-06 (48h ou 1 uso).
export class CreateConvite1756300120000 implements MigrationInterface {
  name = 'CreateConvite1756300120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "convite" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "sala_id" uuid NOT NULL,
        "criado_por" uuid NOT NULL,
        "codigo" varchar(8) NOT NULL,
        "usado" boolean NOT NULL DEFAULT false,
        "expira_em" timestamptz NOT NULL,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_convite" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_convite_codigo" UNIQUE ("codigo"),
        CONSTRAINT "FK_convite_sala" FOREIGN KEY ("sala_id")
          REFERENCES "sala" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_convite_criado_por" FOREIGN KEY ("criado_por")
          REFERENCES "usuario" ("id") ON DELETE CASCADE
      );

      CREATE INDEX "idx_convite_sala" ON "convite" ("sala_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "convite";`);
  }
}
