const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway'
});

async function fixDatabase() {
  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL\n');

    // 1. Arreglar tabla payments - agregar receipt_url
    console.log('🔧 Arreglando tabla payments...');
    try {
      await client.query(`
        ALTER TABLE payments 
        ADD COLUMN IF NOT EXISTS receipt_url TEXT;
      `);
      console.log('✅ Columna receipt_url agregada a payments\n');
    } catch (err) {
      console.log('⚠️  Error en payments:', err.message);
    }

    // 2. Arreglar tabla plans - agregar duration_months
    console.log('🔧 Arreglando tabla plans...');
    try {
      await client.query(`
        ALTER TABLE plans 
        ADD COLUMN IF NOT EXISTS duration_months INTEGER;
      `);
      console.log('✅ Columna duration_months agregada a plans\n');
    } catch (err) {
      console.log('⚠️  Error en plans:', err.message);
    }

    // 3. Arreglar tabla files - cambiar owner_user_id a uploaded_by_user_id
    console.log('🔧 Arreglando tabla files...');
    try {
      // Verificar si owner_user_id existe
      const checkOwner = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'files' AND column_name = 'owner_user_id'
      `);
      
      if (checkOwner.rows.length > 0) {
        await client.query(`
          ALTER TABLE files 
          RENAME COLUMN owner_user_id TO uploaded_by_user_id;
        `);
        console.log('✅ Columna owner_user_id renombrada a uploaded_by_user_id\n');
      } else {
        // Si no existe owner_user_id, crear uploaded_by_user_id
        await client.query(`
          ALTER TABLE files 
          ADD COLUMN IF NOT EXISTS uploaded_by_user_id UUID;
        `);
        console.log('✅ Columna uploaded_by_user_id creada en files\n');
      }
    } catch (err) {
      console.log('⚠️  Error en files:', err.message);
    }

    // 4. Verificar estructura final
    console.log('\n📋 VERIFICANDO ESTRUCTURA FINAL:\n');
    
    const paymentsCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'payments' AND column_name = 'receipt_url'
    `);
    console.log('Payments.receipt_url:', paymentsCheck.rows.length > 0 ? '✅ Existe' : '❌ No existe');

    const plansCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'plans' AND column_name = 'duration_months'
    `);
    console.log('Plans.duration_months:', plansCheck.rows.length > 0 ? '✅ Existe' : '❌ No existe');

    const filesCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'files' AND column_name = 'uploaded_by_user_id'
    `);
    console.log('Files.uploaded_by_user_id:', filesCheck.rows.length > 0 ? '✅ Existe' : '❌ No existe');

    await client.end();
    console.log('\n✅✅✅ BASE DE DATOS ARREGLADA ✅✅✅');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    await client.end();
  }
}

fixDatabase();
