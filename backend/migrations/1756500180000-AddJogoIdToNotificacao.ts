import { MigrationInterface, QueryRunner } from 'typeorm';

// Adiciona jogo_id à tabela `notificacao`, já criada no Sprint 2. O tipo
// 'adicionado_jogo' (fase3_arquitetura_completa) precisa saber a qual jogo
// se refere — mesma lógica que sala_id já cumpre para notificações de sala.
// Migration incremental porque CreateNotificacao já rodou em produção.
export class AddJogoIdToNotificacao1756500180000
  implements MigrationInterface
{
  name = 'AddJogoIdToNotificacao1756500180000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notificacao" ADD COLUMN "jogo_id" uuid;

      ALTER TABLE "notificacao" ADD CONSTRAINT "FK_notificacao_jogo"
        FOREIGN KEY ("jogo_id") REFERENCES "jogo" ("id") ON DELETE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notificacao" DROP CONSTRAINT "FK_notificacao_jogo";
      ALTER TABLE "notificacao" DROP COLUMN "jogo_id";
    `);
  }
}
