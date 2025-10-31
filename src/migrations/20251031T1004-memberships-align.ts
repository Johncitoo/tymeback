import { MigrationInterface, QueryRunner } from 'typeorm';

export class MembershipsAlign20251031T1004 implements MigrationInterface {
  name = 'MembershipsAlign20251031T1004';

  public async up(q: QueryRunner): Promise<void> {
    // Enum estado
    await q.query(`
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='membership_status_enum') THEN
    CREATE TYPE membership_status_enum AS ENUM ('ACTIVE','EXPIRED','CANCELED');
  END IF;
END $$;`);

    // Nuevas columnas y renombres
    await q.query(`
DO $$
BEGIN
  -- gym_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='memberships' AND column_name='gym_id'
  ) THEN
    ALTER TABLE memberships ADD COLUMN gym_id uuid NULL;
    -- intentar inferir desde client -> users.gym_id
    UPDATE memberships m
      SET gym_id = u.gym_id
    FROM users u
    WHERE m.gym_id IS NULL AND m.client_id = u.id;
    -- si todas quedaron con valor, forzar NOT NULL
    IF NOT EXISTS (SELECT 1 FROM memberships WHERE gym_id IS NULL) THEN
      ALTER TABLE memberships ALTER COLUMN gym_id SET NOT NULL;
    END IF;
  END IF;

  -- starts_on -> start_date
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='memberships' AND column_name='starts_on'
  ) THEN
    ALTER TABLE memberships RENAME COLUMN starts_on TO start_date;
  END IF;

  -- ends_on -> end_date
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='memberships' AND column_name='ends_on'
  ) THEN
    ALTER TABLE memberships RENAME COLUMN ends_on TO end_date;
  END IF;

  -- status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='memberships' AND column_name='status'
  ) THEN
    ALTER TABLE memberships ADD COLUMN status membership_status_enum NOT NULL DEFAULT 'ACTIVE';
  END IF;

  -- sessions_quota / sessions_used (por si faltan)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='memberships' AND column_name='sessions_quota'
  ) THEN
    ALTER TABLE memberships ADD COLUMN sessions_quota int NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='memberships' AND column_name='sessions_used'
  ) THEN
    ALTER TABLE memberships ADD COLUMN sessions_used int NOT NULL DEFAULT 0;
  END IF;

  -- note
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='memberships' AND column_name='note'
  ) THEN
    ALTER TABLE memberships ADD COLUMN note text NULL;
  END IF;

  -- timestamps
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='memberships' AND column_name='created_at'
  ) THEN
    ALTER TABLE memberships ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='memberships' AND column_name='updated_at'
  ) THEN
    ALTER TABLE memberships ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='memberships' AND column_name='deleted_at'
  ) THEN
    ALTER TABLE memberships ADD COLUMN deleted_at timestamptz NULL;
  END IF;

  -- Índices útiles
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='idx_memberships_gym_client_status') THEN
    CREATE INDEX idx_memberships_gym_client_status ON memberships(gym_id, client_id, status);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='idx_memberships_gym_client_period') THEN
    CREATE INDEX idx_memberships_gym_client_period ON memberships(gym_id, client_id, start_date, end_date);
  END IF;
END $$;`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS idx_memberships_gym_client_period;`);
    await q.query(`DROP INDEX IF EXISTS idx_memberships_gym_client_status;`);
    // mantenemos columnas/renombres para no perder datos
    await q.query(`DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname='membership_status_enum') THEN
        DROP TYPE membership_status_enum;
      END IF;
    END $$;`);
  }
}
