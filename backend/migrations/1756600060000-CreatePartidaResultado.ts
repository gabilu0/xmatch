import { MigrationInterface, QueryRunner } from 'typeorm';

// Cria a tabela `partida_resultado`. Ver fase3_arquitetura_completa, Parte 2.
export class CreatePartidaResultado1756600060000
  implements MigrationInterface
{
  name = 'CreatePartidaResultado1756600060000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "partida_resultado" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "partida_id" uuid NOT NULL,
        "usuario_id" uuid NOT NULL,
        "vencedor" boolean NOT NULL,
        "pontos" int NOT NULL DEFAULT 1,
        CONSTRAINT "PK_partida_resultado" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_partida_resultado_partida_usuario" UNIQUE ("partida_id", "usuario_id"),
        CONSTRAINT "FK_partida_resultado_partida" FOREIGN KEY ("partida_id")
          REFERENCES "partida" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_partida_resultado_usuario" FOREIGN KEY ("usuario_id")
          REFERENCES "usuario" ("id") ON DELETE CASCADE
      );

      CREATE INDEX "idx_resultado_partida" ON "partida_resultado" ("partida_id");
      CREATE INDEX "idx_resultado_usuario" ON "partida_resultado" ("usuario_id", "vencedor");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "partida_resultado";`);
  }
}
