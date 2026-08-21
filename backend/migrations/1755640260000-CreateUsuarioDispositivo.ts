import { MigrationInterface, QueryRunner } from 'typeorm';

// Cria a tabela `usuario_dispositivo` — tokens FCM por dispositivo.
// Depende de `usuario` já existir. Ver fase3_arquitetura_completa, Parte 2.
export class CreateUsuarioDispositivo1755640260000
  implements MigrationInterface
{
  name = 'CreateUsuarioDispositivo1755640260000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "usuario_dispositivo" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "usuario_id" uuid NOT NULL,
        "fcm_token" text NOT NULL,
        "plataforma" varchar(10) NOT NULL,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        "atualizado_em" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_usuario_dispositivo" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_usuario_dispositivo_fcm_token" UNIQUE ("fcm_token"),
        CONSTRAINT "FK_usuario_dispositivo_usuario" FOREIGN KEY ("usuario_id")
          REFERENCES "usuario" ("id") ON DELETE CASCADE
      );
    `);

    // Índice previsto em fase3_arquitetura_completa — busca de tokens
    // ativos de um usuário para envio de notificações FCM.
    await queryRunner.query(`
      CREATE INDEX "idx_dispositivo_usuario"
        ON "usuario_dispositivo" ("usuario_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_dispositivo_usuario";`);
    await queryRunner.query(`DROP TABLE "usuario_dispositivo";`);
  }
}
