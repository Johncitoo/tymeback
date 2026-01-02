import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixPlansDurationColumns1735779687000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Quitar NOT NULL constraint de duration_months y duration_days
    await queryRunner.query(`
      ALTER TABLE plans 
      ALTER COLUMN duration_months DROP NOT NULL,
      ALTER COLUMN duration_days DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No podemos revertir sin saber qué registros tienen NULL
    // Esta migración es irreversible de forma segura
  }
}
