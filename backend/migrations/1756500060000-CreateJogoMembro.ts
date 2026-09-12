import { MigrationInterface, QueryRunner } from 'typeorm';

// Cria a tabela `jogo_membro`. Ver fase3_arquitetura_completa, Parte 2.
export class CreateJogoMembro1756500060000 implements MigrationInterface {
  name = 'CreateJogoMembro1756500060000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "jogo_membro" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "jogo_id" uuid NOT NULL,
        "usuario_id" uuid NOT NULL,
        "entrou_em" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_jogo_membro" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_jogo_membro_jogo_usuario" UNIQUE ("jogo_id", "usuario_id"),
        CONSTRAINT "FK_jogo_membro_jogo" FOREIGN KEY ("jogo_id")
          REFERENCES "jogo" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_jogo_membro_usuario" FOREIGN KEY ("usuario_id")
          REFERENCES "usuario" ("id") ON DELETE CASCADE
      );

      CREATE INDEX "idx_jogo_membro_jogo" ON "jogo_membro" ("jogo_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "jogo_membro";`);
  }
}
