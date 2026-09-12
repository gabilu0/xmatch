import { MigrationInterface, QueryRunner } from 'typeorm';

// Cria a tabela `season`. Ver fase3_arquitetura_completa, Parte 2, RF-03.10.
export class CreateSeason1756500120000 implements MigrationInterface {
  name = 'CreateSeason1756500120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "season" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "jogo_id" uuid NOT NULL,
        "campeao_id" uuid,
        "numero" int NOT NULL,
        "iniciada_em" timestamptz NOT NULL DEFAULT now(),
        "encerrada_em" timestamptz,
        CONSTRAINT "PK_season" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_season_jogo_numero" UNIQUE ("jogo_id", "numero"),
        CONSTRAINT "FK_season_jogo" FOREIGN KEY ("jogo_id")
          REFERENCES "jogo" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_season_campeao" FOREIGN KEY ("campeao_id")
          REFERENCES "usuario" ("id") ON DELETE SET NULL
      );

      CREATE INDEX "idx_season_jogo" ON "season" ("jogo_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "season";`);
  }
}
