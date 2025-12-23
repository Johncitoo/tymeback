// Test directo con TypeORM simulando el entorno de Railway
const { DataSource } = require('typeorm');
const path = require('path');

const AppDataSource = new DataSource({
  type: 'postgres',
  url: 'postgresql://postgres:DanpBohSbQluYBnEIpTGDoYVCDiUslqG@maglev.proxy.rlwy.net:51300/railway',
  logging: ['query', 'error', 'warn'],
  synchronize: false,
  entities: [path.join(__dirname, 'src/**/*.entity.{ts,js}')],
});

async function testTypeORMQuery() {
  try {
    await AppDataSource.initialize();
    console.log('✅ DataSource inicializado');

    const gymId = '0534eb53-544d-48a4-9eca-a2912025c725';

    // Test 1: Query manual (debería funcionar)
    console.log('\n🧪 TEST 1: Query manual con QueryRunner');
    const queryRunner = AppDataSource.createQueryRunner();
    const manualResult = await queryRunner.query(`
      SELECT u.id, u.email, u.first_name, u.last_name
      FROM users u
      INNER JOIN gym_users gu ON gu.user_id = u.id
      WHERE gu.gym_id = $1
      LIMIT 5
    `, [gymId]);
    console.log('✅ Query manual funciona:', manualResult.length, 'usuarios');
    await queryRunner.release();

    // Test 2: Query Builder (como en el servicio)
    console.log('\n🧪 TEST 2: Query Builder (simulando users.service)');
    
    // Cargar la entidad User
    const UserEntity = AppDataSource.getMetadata('User');
    console.log('User entity columns:', UserEntity.columns.map(c => c.propertyName));
    
    const repo = AppDataSource.getRepository('User'); // Usar nombre de clase, no tabla
    
    const qb = repo
      .createQueryBuilder('u')
      .select([
        'u.id', 'u.email', 'u.firstName', 'u.lastName', 'u.fullName',
        'u.phone', 'u.rut', 'u.birthDate', 'u.gender', 'u.sex',
        'u.address', 'u.avatarUrl', 'u.platformRole', 'u.isActive',
        'u.createdAt', 'u.updatedAt'
      ])
      .innerJoin('gym_users', 'gu', 'gu.user_id = u.id')
      .where('gu.gym_id = :gymId', { gymId })
      .orderBy('u.created_at', 'DESC')
      .take(5);

    console.log('SQL generado:', qb.getSql());
    console.log('Params:', qb.getParameters());

    try {
      const result = await qb.getMany();
      console.log('✅ Query Builder funciona:', result.length, 'usuarios');
    } catch (error) {
      console.error('❌ Error en Query Builder:', error.message);
      console.error('Stack:', error.stack);
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

testTypeORMQuery();
