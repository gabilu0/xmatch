import { MigrationInterface, QueryRunner } from 'typeorm';

// Adiciona a FK de partida_id em `notificacao`, que já existia como coluna
// solta desde o Sprint 2 (comentário na entity avisava: "a FK real pode ser
// adicionada quando partida existir" — agora existe).
export class AddPartidaIdFkToNotificacao1756600120000
  implements MigrationInterface
{
  name = 'AddPartidaIdFkToNotificacao1756600120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notificacao" ADD CONSTRAINT "FK_notificacao_partida"
        FOREIGN KEY ("partida_id") REFERENCES "partida" ("id") ON DELETE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notificacao" DROP CONSTRAINT "FK_notificacao_partida";
    `);
  }
}
