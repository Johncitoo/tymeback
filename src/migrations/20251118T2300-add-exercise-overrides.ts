import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExerciseOverrides20251118T2300 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna exercise_overrides si no existe
    await queryRunner.query(`
      ALTER TABLE "routine_assignments" 
      ADD COLUMN IF NOT EXISTS "exercise_overrides" jsonb DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir: eliminar columna
    await queryRunner.query(`
      ALTER TABLE "routine_assignments" 
      DROP COLUMN IF EXISTS "exercise_overrides"
    `);
  }
}
