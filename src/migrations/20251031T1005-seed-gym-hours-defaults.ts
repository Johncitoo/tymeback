import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedGymHoursDefaults20251031T1005 implements MigrationInterface {
  name = 'SeedGymHoursDefaults20251031T1005';

  public async up(q: QueryRunner): Promise<void> {
    // Inserta faltantes por cada gym: L–V 07:00–21:00, S 09:00–14:00, D cerrado
    await q.query(`
WITH g AS (SELECT id AS gym_id FROM gyms)
INSERT INTO gym_hours (gym_id, day_of_week, is_open, open_time, close_time, created_at, updated_at)
SELECT
  g.gym_id,
  d.dow,
  CASE WHEN d.dow BETWEEN 0 AND 4 THEN true
       WHEN d.dow = 5 THEN true
       ELSE false END AS is_open,
  CASE WHEN d.dow BETWEEN 0 AND 4 THEN '07:00'
       WHEN d.dow = 5 THEN '09:00'
       ELSE NULL END AS open_time,
  CASE WHEN d.dow BETWEEN 0 AND 4 THEN '21:00'
       WHEN d.dow = 5 THEN '14:00'
       ELSE NULL END AS close_time,
  now(), now()
FROM g
CROSS JOIN (VALUES (0),(1),(2),(3),(4),(5),(6)) AS d(dow)
WHERE NOT EXISTS (
  SELECT 1 FROM gym_hours x
  WHERE x.gym_id = g.gym_id AND x.day_of_week = d.dow
);
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    // No borramos seeds (evitar remover horarios válidos).
  }
}
