import { MigrationInterface, QueryRunner } from 'typeorm';

export class GymHoursNormalization20251031T1001 implements MigrationInterface {
  name = 'GymHoursNormalization20251031T1001';

  public async up(q: QueryRunner): Promise<void> {
    // --- gym_hours: weekday->day_of_week (0=Lun..6=Dom), is_closed->is_open ---
    await q.query(`
DO $$
BEGIN
  -- day_of_week
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='gym_hours' AND column_name='day_of_week'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='gym_hours' AND column_name='weekday'
    ) THEN
      ALTER TABLE gym_hours ADD COLUMN day_of_week int;
      UPDATE gym_hours
      SET day_of_week = CASE weekday
        WHEN 1 THEN 0  -- Lunes
        WHEN 2 THEN 1
        WHEN 3 THEN 2
        WHEN 4 THEN 3
        WHEN 5 THEN 4
        WHEN 6 THEN 5
        WHEN 7 THEN 6  -- Domingo
        ELSE 0 END;
      ALTER TABLE gym_hours ALTER COLUMN day_of_week SET NOT NULL;
      ALTER TABLE gym_hours DROP COLUMN weekday;
    ELSE
      ALTER TABLE gym_hours ADD COLUMN day_of_week int NOT NULL;
    END IF;
  END IF;

  -- is_open
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='gym_hours' AND column_name='is_open'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='gym_hours' AND column_name='is_closed'
    ) THEN
      ALTER TABLE gym_hours ADD COLUMN is_open boolean;
      UPDATE gym_hours SET is_open = NOT COALESCE(is_closed, false);
      ALTER TABLE gym_hours ALTER COLUMN is_open SET NOT NULL;
      ALTER TABLE gym_hours DROP COLUMN is_closed;
    ELSE
      ALTER TABLE gym_hours ADD COLUMN is_open boolean NOT NULL DEFAULT false;
    END IF;
  END IF;

  -- open_time / close_time (por si faltan)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='gym_hours' AND column_name='open_time'
  ) THEN
    ALTER TABLE gym_hours ADD COLUMN open_time text NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='gym_hours' AND column_name='close_time'
  ) THEN
    ALTER TABLE gym_hours ADD COLUMN close_time text NULL;
  END IF;

  -- índice único (gym_id, day_of_week)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname='uniq_gym_hours_gym_day'
  ) THEN
    CREATE UNIQUE INDEX uniq_gym_hours_gym_day
      ON gym_hours(gym_id, day_of_week);
  END IF;

  -- si existía el único anterior por weekday, intenta eliminarlo
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='gym_hours_gym_id_weekday_key') THEN
    DROP INDEX gym_hours_gym_id_weekday_key;
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- si la tabla no existe, no hacemos nada
  NULL;
END $$;
    `);

    // --- gym_hour_overrides: day_date->date, is_closed->is_open ---
    await q.query(`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='gym_hour_overrides' AND column_name='day_date'
  ) THEN
    ALTER TABLE gym_hour_overrides RENAME COLUMN day_date TO date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='gym_hour_overrides' AND column_name='is_open'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='gym_hour_overrides' AND column_name='is_closed'
    ) THEN
      ALTER TABLE gym_hour_overrides ADD COLUMN is_open boolean;
      UPDATE gym_hour_overrides SET is_open = NOT COALESCE(is_closed, false);
      ALTER TABLE gym_hour_overrides ALTER COLUMN is_open SET NOT NULL;
      ALTER TABLE gym_hour_overrides DROP COLUMN is_closed;
    ELSE
      ALTER TABLE gym_hour_overrides ADD COLUMN is_open boolean NOT NULL DEFAULT false;
    END IF;
  END IF;

  -- open/close_time por si faltan
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='gym_hour_overrides' AND column_name='open_time'
  ) THEN
    ALTER TABLE gym_hour_overrides ADD COLUMN open_time text NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='gym_hour_overrides' AND column_name='close_time'
  ) THEN
    ALTER TABLE gym_hour_overrides ADD COLUMN close_time text NULL;
  END IF;

  -- índice único (gym_id, date)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname='uniq_gym_hour_overrides_gym_date'
  ) THEN
    CREATE UNIQUE INDEX uniq_gym_hour_overrides_gym_date
      ON gym_hour_overrides(gym_id, date);
  END IF;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS uniq_gym_hour_overrides_gym_date;`);
    await q.query(`DROP INDEX IF EXISTS uniq_gym_hours_gym_day;`);
    // no revertimos renombres/flags para evitar pérdida de datos
  }
}
