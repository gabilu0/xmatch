import { MigrationInterface, QueryRunner } from 'typeorm';

// Cria a tabela `notificacao`. Ver fase3_arquitetura_completa, Parte 2.
// partida_id fica sem FK (tabela `partida` ainda não existe — Sprint 4).
export class CreateNotificacao1756400000000 implements MigrationInterface {
  name = 'CreateNotificacao1756400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notificacao" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "usuario_id" uuid NOT NULL,
        "partida_id" uuid,
        "sala_id" uuid,
        "tipo" varchar(50) NOT NULL,
        "lida" boolean NOT NULL DEFAULT false,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notificacao" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notificacao_usuario" FOREIGN KEY ("usuario_id")
          REFERENCES "usuario" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notificacao_sala" FOREIGN KEY ("sala_id")
          REFERENCES "sala" ("id") ON DELETE CASCADE
      );

      CREATE INDEX "idx_notificacao_usuario" ON "notificacao" ("usuario_id", "lida");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notificacao";`);
  }
}
