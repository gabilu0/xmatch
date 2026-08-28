import { MigrationInterface, QueryRunner } from 'typeorm';

// Cria a tabela `sala`. Ver fase3_arquitetura_completa, Parte 2.
export class CreateSala1756300000000 implements MigrationInterface {
  name = 'CreateSala1756300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sala" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "lider_id" uuid NOT NULL,
        "nome" varchar(50) NOT NULL,
        "foto_url" text,
        "encerrada" boolean NOT NULL DEFAULT false,
        "encerrada_em" timestamptz,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sala" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sala_lider" FOREIGN KEY ("lider_id")
          REFERENCES "usuario" ("id") ON DELETE RESTRICT
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sala";`);
  }
}
