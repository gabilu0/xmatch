import { MigrationInterface, QueryRunner } from 'typeorm';

// Cria a tabela `amizade`. Schema inferido da UC-04 (casos_de_uso) — não
// consta no modelo de dados do fase3_arquitetura_completa. Depende só de
// `usuario` já existir.
export class CreateAmizade1756300180000 implements MigrationInterface {
  name = 'CreateAmizade1756300180000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "amizade" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "solicitante_id" uuid NOT NULL,
        "destinatario_id" uuid NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'pendente',
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        "atualizado_em" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_amizade" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_amizade_par" UNIQUE ("solicitante_id", "destinatario_id"),
        CONSTRAINT "CK_amizade_nao_autoamizade" CHECK ("solicitante_id" <> "destinatario_id"),
        CONSTRAINT "FK_amizade_solicitante" FOREIGN KEY ("solicitante_id")
          REFERENCES "usuario" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_amizade_destinatario" FOREIGN KEY ("destinatario_id")
          REFERENCES "usuario" ("id") ON DELETE CASCADE
      );

      CREATE INDEX "idx_amizade_destinatario" ON "amizade" ("destinatario_id");

      -- Impede um pedido pendente em qualquer direção enquanto já existir
      -- outro pendente entre o mesmo par (Opção B: quem recebeu só pode
      -- aceitar ou recusar, nunca "cruzar" com um pedido próprio).
      -- Reforça em nível de banco a checagem que o AmigoService já faz,
      -- contra condições de corrida.
      CREATE UNIQUE INDEX "idx_amizade_par_pendente"
        ON "amizade" (LEAST(solicitante_id, destinatario_id), GREATEST(solicitante_id, destinatario_id))
        WHERE status = 'pendente';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "amizade";`);
  }
}
