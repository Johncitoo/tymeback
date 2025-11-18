/**
 * Script para crear usuarios de prueba
 * Ejecutar: npm run seed:users
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { GymsService } from '../gyms/gyms.service';
import { RoleEnum } from '../users/entities/user.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const gymsService = app.get(GymsService);

  try {
    console.log('🌱 Iniciando seed de usuarios...');

    // Obtener o crear gimnasio
    let gym;
    try {
      const gyms = await gymsService.findAll();
      gym = gyms[0];
      if (!gym) {
        throw new Error('No gym found');
      }
      console.log('✅ Gimnasio encontrado:', gym.name);
    } catch {
      console.log('⚠️ No se encontró gimnasio, creando uno...');
      gym = await gymsService.create({
        name: 'TYME Gym Principal',
        address: 'Av. Providencia 123, Santiago',
        phone: '+56912345678',
        email: 'info@tymegym.cl',
      });
      console.log('✅ Gimnasio creado:', gym.name);
    }

    const gymId = gym.id;

    // Usuarios de prueba
    const testUsers = [
      {
        role: RoleEnum.ADMIN,
        fullName: 'Admin Tyme',
        email: 'admin@tyme.cl',
        password: 'Admin123!',
        phone: '+56912345678',
        rut: '12345678-9',
        gymId,
      },
      {
        role: RoleEnum.CLIENT,
        fullName: 'Cliente Demo',
        email: 'cliente@tyme.cl',
        password: 'Cliente123!',
        phone: '+56987654321',
        rut: '98765432-1',
        birthDate: '1990-05-15',
        gender: 'male',
        gymId,
      },
      {
        role: RoleEnum.TRAINER,
        fullName: 'Entrenador Demo',
        email: 'entrenador@tyme.cl',
        password: 'Entrenador123!',
        phone: '+56911223344',
        rut: '11223344-5',
        specialties: ['Fuerza', 'Hipertrofia', 'Funcional'],
        gymId,
      },
      {
        role: RoleEnum.NUTRITIONIST,
        fullName: 'Nutricionista Demo',
        email: 'nutricionista@tyme.cl',
        password: 'Nutricionista123!',
        phone: '+56955667788',
        rut: '55667788-9',
        specialties: ['Nutrición Deportiva', 'Control de Peso'],
        licenseNumber: 'NUT-2024-001',
        gymId,
      },
    ];

    console.log('\n📝 Creando usuarios...\n');

    for (const userData of testUsers) {
      try {
        // Verificar si el usuario ya existe
        const existing = await usersService.findByEmail(userData.email);
        if (existing) {
          console.log(`⚠️  ${userData.role.toUpperCase()}: Ya existe (${userData.email})`);
          continue;
        }

        const user = await usersService.create(userData as any);
        
        // Activar usuario automáticamente
        await usersService.activateAccount(user.activationToken);
        
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
