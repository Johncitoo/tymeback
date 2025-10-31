import { MigrationInterface, QueryRunner } from 'typeorm';

export class AppointmentsAndStaff20251031T1003 implements MigrationInterface {
  name = 'AppointmentsAndStaff20251031T1003';

  public async up(q: QueryRunner): Promise<void> {
    // Enums
    await q.query(`
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='appointment_status_enum') THEN
    CREATE TYPE appointment_status_enum AS ENUM ('BOOKED','CONFIRMED','COMPLETED','CANCELED','NO_SHOW');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='appointment_type_enum') THEN
    CREATE TYPE appointment_type_enum AS ENUM ('TRAINING','NUTRITION','OTHER');
  END IF;
END $$;`);

    // staff_availability
    await q.query(`
CREATE TABLE IF NOT EXISTS staff_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL,
  staff_id uuid NOT NULL,
  weekday int NOT NULL,             -- 0=Lun..6=Dom
  is_available boolean NOT NULL DEFAULT true,
  start_time text NOT NULL,
  end_time text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_staff_availability_gym_staff_day
  ON staff_availability(gym_id, staff_id, weekday);
    `);

    // staff_time_off
    await q.query(`
CREATE TABLE IF NOT EXISTS staff_time_off (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL,
  staff_id uuid NOT NULL,
  date date NOT NULL,
  start_time text NULL,
  end_time text NULL,
  reason text NULL
);
CREATE INDEX IF NOT EXISTS idx_staff_time_off_gym_staff_date
  ON staff_time_off(gym_id, staff_id, date);
    `);

    // appointments
    await q.query(`
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL,
  type appointment_type_enum NOT NULL,
  client_id uuid NOT NULL,
  staff_id uuid NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  status appointment_status_enum NOT NULL DEFAULT 'BOOKED',
  requires_session boolean NOT NULL DEFAULT false,
  membership_id uuid NULL,
  created_by_user_id uuid NOT NULL,
  canceled_by_user_id uuid NULL,
  cancel_reason text NULL,
  rescheduled_from_id uuid NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_appointments_gym_staff_start
  ON appointments(gym_id, staff_id, start_at);
CREATE INDEX IF NOT EXISTS idx_appointments_gym_client_start
  ON appointments(gym_id, client_id, start_at);
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS appointments;`);
    await q.query(`DROP TABLE IF EXISTS staff_time_off;`);
    await q.query(`DROP TABLE IF EXISTS staff_availability;`);
    await q.query(`DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname='appointment_status_enum') THEN
        DROP TYPE appointment_status_enum;
      END IF;
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname='appointment_type_enum') THEN
        DROP TYPE appointment_type_enum;
      END IF;
    END $$;`);
  }
}
