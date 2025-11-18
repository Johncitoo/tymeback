/**
 * Script para crear usuarios de prueba
 * Ejecutar: npm run seed:users
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Repository } from 'typeorm';
import { User, RoleEnum, GenderEnum } from '../users/entities/user.entity';
import { Gym } from '../gyms/entities/gym.entity';
import * as crypto from 'crypto';

function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(plain, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$100000$${salt}$${hash}`;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersRepo = app.get<Repository<User>>('UserRepository');
  const gymsRepo = app.get<Repository<Gym>>('GymRepository');

  try {
    console.log('🌱 Iniciando seed de usuarios...');

    // Obtener o crear gimnasio
    let gym = await gymsRepo.findOne({ where: {} });
    
    if (!gym) {
      console.log('⚠️ No se encontró gimnasio, creando uno...');
      gym = gymsRepo.create({
        name: 'TYME Gym Principal',
        slug: 'tyme-gym-principal',
      });
      gym = await gymsRepo.save(gym);
      console.log('✅ Gimnasio creado:', gym.name);
    } else {
      console.log('✅ Gimnasio encontrado:', gym.name);
    }

    const gymId = gym.id;

    // Usuarios de prueba (solo User, sin datos específicos de rol)
    const testUsers = [
      {
        role: RoleEnum.ADMIN,
        fullName: 'Admin Tyme',
        email: 'admin@tyme.cl',
        password: 'Admin123!',
        phone: '+56912345678',
        rut: '12345678-9',
      },
      {
        role: RoleEnum.CLIENT,
        fullName: 'Cliente Demo',
        email: 'cliente@tyme.cl',
        password: 'Cliente123!',
        phone: '+56987654321',
        rut: '98765432-1',
        birthDate: new Date('1990-05-15'),
        gender: GenderEnum.MALE,
      },
      {
        role: RoleEnum.TRAINER,
        fullName: 'Entrenador Demo',
        email: 'entrenador@tyme.cl',
        password: 'Entrenador123!',
        phone: '+56911223344',
        rut: '11223344-5',
      },
      {
        role: RoleEnum.NUTRITIONIST,
        fullName: 'Nutricionista Demo',
        email: 'nutricionista@tyme.cl',
        password: 'Nutricionista123!',
        phone: '+56955667788',
        rut: '55667788-9',
      },
    ];

    console.log('\n📝 Creando usuarios...\n');

    for (const userData of testUsers) {
      try {
        // Verificar si el usuario ya existe
        const existing = await usersRepo.findOne({ where: { email: userData.email } });
        if (existing) {
          console.log(`⚠️  ${userData.role.toUpperCase()}: Ya existe (${userData.email})`);
          continue;
        }

        const user = usersRepo.create({
          gymId: gymId,
          role: userData.role,
          fullName: userData.fullName,
          email: userData.email,
          hashedPassword: hashPassword(userData.password),
          phone: userData.phone,
          rut: userData.rut,
          birthDate: userData.birthDate || null,
          gender: userData.gender || null,
          isActive: true, // Pre-activado
        });
        
        await usersRepo.save(user);
        
        console.log(`✅ ${userData.role.toUpperCase()}: ${userData.fullName}`);
        console.log(`   📧 Email: ${userData.email}`);
        console.log(`   🔑 Password: ${userData.password}`);
        console.log(`   🆔 ID: ${user.id}\n`);
      } catch (error) {
        console.error(`❌ Error creando ${userData.role}:`, error.message);
      }
    }

    console.log('\n🎉 Seed completado!\n');
    console.log('📋 CREDENCIALES DE ACCESO:\n');
    console.log('ADMIN:');
    console.log('  Email: admin@tyme.cl');
    console.log('  Password: Admin123!\n');
    console.log('CLIENTE:');
    console.log('  Email: cliente@tyme.cl');
    console.log('  Password: Cliente123!\n');
    console.log('ENTRENADOR:');
    console.log('  Email: entrenador@tyme.cl');
    console.log('  Password: Entrenador123!\n');
    console.log('NUTRICIONISTA:');
    console.log('  Email: nutricionista@tyme.cl');
    console.log('  Password: Nutricionista123!\n');

  } catch (error) {
    console.error('❌ Error en seed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
