import { MigrationInterface, QueryRunner } from 'typeorm';

// Cria a tabela `jogo`. Ver casos_de_uso (UC-11) e fase4_planejamento
// (Sprint 3). Modo com 3 valores — ver nota de escopo na entity Jogo.
export class CreateJogo1756500000000 implements MigrationInterface {
  name = 'CreateJogo1756500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "jogo" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "sala_id" uuid NOT NULL,
        "nome" varchar(50) NOT NULL,
        "modo" varchar(20) NOT NULL,
        "ciclo" varchar(20) NOT NULL,
        "meta_vitorias" int,
        "arquivado" boolean NOT NULL DEFAULT false,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_jogo" PRIMARY KEY ("id"),
        CONSTRAINT "FK_jogo_sala" FOREIGN KEY ("sala_id")
          REFERENCES "sala" ("id") ON DELETE CASCADE
      );

      CREATE INDEX "idx_jogo_sala" ON "jogo" ("sala_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "jogo";`);
  }
}
