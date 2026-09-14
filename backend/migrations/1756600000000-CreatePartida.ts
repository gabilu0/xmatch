import { MigrationInterface, QueryRunner } from 'typeorm';

// Cria a tabela `partida`. Ver fase3_arquitetura_completa, Parte 2
// (inclusive os índices obrigatórios de placar/expiração).
export class CreatePartida1756600000000 implements MigrationInterface {
  name = 'CreatePartida1756600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "partida" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "jogo_id" uuid NOT NULL,
        "season_id" uuid,
        "registrado_por" uuid NOT NULL,
        "status" varchar(20) NOT NULL,
        "expira_em" timestamptz NOT NULL,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        "atualizado_em" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_partida" PRIMARY KEY ("id"),
        CONSTRAINT "FK_partida_jogo" FOREIGN KEY ("jogo_id")
          REFERENCES "jogo" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_partida_season" FOREIGN KEY ("season_id")
          REFERENCES "season" ("id") ON DELETE SET NULL,
        CONSTRAINT "FK_partida_registrado_por" FOREIGN KEY ("registrado_por")
          REFERENCES "usuario" ("id") ON DELETE CASCADE
      );

      CREATE INDEX "idx_partida_jogo_status" ON "partida" ("jogo_id", "status");
      CREATE INDEX "idx_partida_season_status" ON "partida" ("season_id", "status");
      CREATE INDEX "idx_partida_expira" ON "partida" ("expira_em", "status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "partida";`);
  }
}
