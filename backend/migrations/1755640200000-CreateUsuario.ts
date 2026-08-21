import { MigrationInterface, QueryRunner } from 'typeorm';

// Cria a tabela `usuario` — base de toda a hierarquia do xMatch
// (Usuário → Sala → Jogo → Partida). Ver fase3_arquitetura_completa, Parte 2.
export class CreateUsuario1755640200000 implements MigrationInterface {
  name = 'CreateUsuario1755640200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    `);

    await queryRunner.query(`
      CREATE TABLE "usuario" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "apelido" varchar(30) NOT NULL,
        "email" varchar(255),
        "senha_hash" text,
        "google_id" varchar(100),
        "foto_url" text,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        "atualizado_em" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_usuario" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_usuario_apelido" UNIQUE ("apelido"),
        CONSTRAINT "UQ_usuario_email" UNIQUE ("email"),
        CONSTRAINT "UQ_usuario_google_id" UNIQUE ("google_id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "usuario";`);
  }
}
