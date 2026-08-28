import { MigrationInterface, QueryRunner } from 'typeorm';

// Cria a tabela `sala_membro`. Depende de `sala` e `usuario` já existirem.
// Ver fase3_arquitetura_completa, Parte 2.
export class CreateSalaMembro1756300060000 implements MigrationInterface {
  name = 'CreateSalaMembro1756300060000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sala_membro" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "sala_id" uuid NOT NULL,
        "usuario_id" uuid NOT NULL,
        "entrou_em" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sala_membro" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sala_membro_sala_usuario" UNIQUE ("sala_id", "usuario_id"),
        CONSTRAINT "FK_sala_membro_sala" FOREIGN KEY ("sala_id")
          REFERENCES "sala" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sala_membro_usuario" FOREIGN KEY ("usuario_id")
          REFERENCES "usuario" ("id") ON DELETE CASCADE
      );

      CREATE INDEX "idx_sala_membro_sala" ON "sala_membro" ("sala_id");
      CREATE INDEX "idx_sala_membro_usuario" ON "sala_membro" ("usuario_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sala_membro";`);
  }
}
