import { MigrationInterface, QueryRunner } from 'typeorm';

export class Extensions20251031T1000 implements MigrationInterface {
  name = 'Extensions20251031T1000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE EXTENSION IF NOT EXISTS citext;`);
    await q.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
  }

  public async down(): Promise<void> {
    // No se bajan extensiones en down por seguridad
  }
}
