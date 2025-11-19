import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

async function runMigration() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    // Agregar exercise_overrides
    await dataSource.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'routine_assignments' 
              AND column_name = 'exercise_overrides'
          ) THEN
              ALTER TABLE routine_assignments 
              ADD COLUMN exercise_overrides JSONB DEFAULT NULL;
              RAISE NOTICE 'Columna exercise_overrides agregada';
          ELSE
              RAISE NOTICE 'Columna exercise_overrides ya existe';
          END IF;
      END $$;
    `);

    // Agregar snapshot
    await dataSource.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'routine_assignments' 
              AND column_name = 'snapshot'
          ) THEN
              ALTER TABLE routine_assignments 
              ADD COLUMN snapshot JSONB NOT NULL DEFAULT '{}'::jsonb;
              RAISE NOTICE 'Columna snapshot agregada';
          ELSE
              RAISE NOTICE 'Columna snapshot ya existe';
          END IF;
      END $$;
    `);

    // Agregar updated_at
    await dataSource.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'routine_assignments' 
              AND column_name = 'updated_at'
          ) THEN
              ALTER TABLE routine_assignments 
              ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
              RAISE NOTICE 'Columna updated_at agregada';
          ELSE
              RAISE NOTICE 'Columna updated_at ya existe';
          END IF;
      END $$;
    `);

    console.log('✅ Migración completada exitosamente');
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('✅ Script de migración finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script de migración falló:', error);
      process.exit(1);
    });
}

export { runMigration };
