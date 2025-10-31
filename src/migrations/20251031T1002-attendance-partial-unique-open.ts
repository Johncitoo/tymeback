import { MigrationInterface, QueryRunner } from 'typeorm';

export class AttendancePartialUniqueOpen20251031T1002 implements MigrationInterface {
  name = 'AttendancePartialUniqueOpen20251031T1002';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
CREATE UNIQUE INDEX IF NOT EXISTS uniq_attendance_open_per_client
  ON attendance(client_id)
  WHERE check_out_at IS NULL;
    `);

    await q.query(`
CREATE INDEX IF NOT EXISTS idx_attendance_client_open
  ON attendance(client_id)
  WHERE check_out_at IS NULL;
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS idx_attendance_client_open;`);
    await q.query(`DROP INDEX IF EXISTS uniq_attendance_open_per_client;`);
  }
}
