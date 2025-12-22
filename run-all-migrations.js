const { Client } = require('pg');
require('dotenv').config();

async function runAllMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // 1. Fix payments table
    console.log('\n📦 1. Agregando columna receipt_file_id a payments...');
    await client.query(`
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_file_id uuid NULL;
    `);
    console.log('✅ Columna receipt_file_id agregada');

    // 2. Create automated_email_templates table
    console.log('\n📦 2. Creando tabla automated_email_templates...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS automated_email_templates (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
        type varchar(50) NOT NULL,
        name varchar(200) NOT NULL,
        subject varchar(200) NOT NULL,
        content_body text NOT NULL,
        available_variables jsonb NOT NULL DEFAULT '{}',
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );
    `);
    console.log('✅ Tabla automated_email_templates creada');

    // 3. Create unique index for automated_email_templates
    console.log('\n📦 3. Creando índice único para automated_email_templates...');
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS IDX_AUTOMATED_EMAIL_GYM_TYPE 
      ON automated_email_templates(gym_id, type);
    `);
    console.log('✅ Índice creado');

    // 4. Create mass_emails table
    console.log('\n📦 4. Creando tabla mass_emails...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS mass_emails (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        gym_id uuid NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
        created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject varchar(200) NOT NULL,
        content_body text NOT NULL,
        filter_type varchar(50) NOT NULL,
        filter_params jsonb,
        total_recipients int NOT NULL DEFAULT 0,
        sent_count int NOT NULL DEFAULT 0,
        failed_count int NOT NULL DEFAULT 0,
        status varchar(20) NOT NULL DEFAULT 'DRAFT',
        sent_at timestamptz,
        created_at timestamp NOT NULL DEFAULT now()
      );
    `);
    console.log('✅ Tabla mass_emails creada');

    // 5. Create index for mass_emails
    console.log('\n📦 5. Creando índice para mass_emails...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS IDX_MASS_EMAILS_GYM_CREATED 
      ON mass_emails(gym_id, created_at);
    `);
    console.log('✅ Índice creado');

    // 6. Register migrations in migrations table
    console.log('\n📦 6. Registrando migraciones...');
    await client.query(`
      INSERT INTO migrations (timestamp, name) 
      VALUES 
        (1734830000000, 'CreateAutomatedEmailsTablesRevisado1734830000000'),
        (1734830000001, 'FixPaymentsReceiptFileId1734830000001')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Migraciones registradas');

    console.log('\n✅ ¡Todas las migraciones ejecutadas correctamente!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runAllMigrations();
