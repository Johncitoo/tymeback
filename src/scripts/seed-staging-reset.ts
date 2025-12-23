/**
 * Script para configurar staging: crea un solo gimnasio TYME,
 * crea los usuarios solicitados (hash compatible pbkdf2) y 2 planes.
 * USO:
 * 1) Asegúrate de haber hecho backup de la BD staging (pg_dump)
 * 2) Ejecutar: npm run seed:staging-reset (desde backend)
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Gym } from '../gyms/entities/gym.entity';
import { User } from '../users/entities/user.entity';
import { GymUser } from '../gym-users/entities/gym-user.entity';
import { Plan } from '../plans/entities/plan.entity';
import { RoleEnum } from '../users/entities/user.entity';

function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(plain, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$100000$${salt}$${hash}`;
}

function randomPassword(length = 16) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const gymsRepo = app.get<Repository<Gym>>('GymRepository');
  const usersRepo = app.get<Repository<User>>('UserRepository');
  const gymUsersRepo = app.get<Repository<GymUser>>('GymUserRepository');
  const plansRepo = app.get<Repository<Plan>>('PlanRepository');

  try {
    console.log('🔁 Iniciando seed-staging-reset...');

    // Borrar datos relevantes
    console.log('🧹 Limpiando tablas relacionadas...');
    await gymUsersRepo.query('DELETE FROM gym_users');
    await gymsRepo.query('DELETE FROM gyms');
    await plansRepo.query('DELETE FROM plans');
    await usersRepo.query('DELETE FROM users');

    // Crear gimnasio TYME
    console.log('🏋️ Creando gimnasio TYME...');
    const gymEntity = gymsRepo.create({
      name: 'TYME',
      slug: 'tyme',
      email: 'nbarreraprado@gmail.com',
      isActive: true,
    } as any) as unknown as Gym;
    const gym = await gymsRepo.save(gymEntity);
    console.log('✅ Gym creado:', gym.id);

    // Crear usuarios solicitados
    const usersToCreate = [
      { email: 'juanjacontrerasra@gmail.com', password: 'apocalipto11', role: RoleEnum.SUPER_ADMIN, fullName: 'Juan J Contreras' },
      { email: 'estebandiazaranda@gmail.com', password: 'somosTYME.2025', role: RoleEnum.SUPER_ADMIN, fullName: 'Esteban Diaz Aranda' },
    ];

    // Admins cuyos passwords debemos generar y devolver
    const admins = [
      { email: 'nbarreraprado@gmail.com', role: RoleEnum.ADMIN, fullName: 'NBarrera Prado' },
      { email: 'diego.f.pinzon@icloud.com', role: RoleEnum.ADMIN, fullName: 'Diego Pinzon' },
    ];

    const createdUsers: { email: string; password: string }[] = [];

    for (const u of usersToCreate) {
      console.log(`🔐 Creando usuario ${u.email} (${u.role})`);
      const user = usersRepo.create({
        email: u.email,
        hashedPassword: hashPassword(u.password),
        firstName: u.fullName.split(' ')[0] || u.fullName,
        lastName: u.fullName.split(' ').slice(1).join(' ') || '',
        isActive: true,
      } as any);
      const saved = (await usersRepo.save(user)) as unknown as User;
      // membership gym_user
      const gu = gymUsersRepo.create({ gymId: gym.id, userId: saved.id, role: u.role, isActive: true } as any);
      await gymUsersRepo.save(gu);
      createdUsers.push({ email: u.email, password: u.password });
    }

    for (const a of admins) {
      const pwd = randomPassword(16);
      console.log(`🔐 Creando admin ${a.email} (password generado)`);
      const user = usersRepo.create({
        email: a.email,
        hashedPassword: hashPassword(pwd),
        firstName: a.fullName.split(' ')[0] || a.fullName,
        lastName: a.fullName.split(' ').slice(1).join(' ') || '',
        isActive: true,
      } as any);
      const saved = (await usersRepo.save(user)) as unknown as User;
      const gu = gymUsersRepo.create({ gymId: gym.id, userId: saved.id, role: a.role, isActive: true } as any);
      await gymUsersRepo.save(gu);
      createdUsers.push({ email: a.email, password: pwd });
    }

    // Crear 2 planes de prueba
    console.log('💳 Creando 2 planes de prueba...');
    const p1 = plansRepo.create({
      gymId: gym.id,
      name: 'Plan Test Mensual',
      description: 'Plan mensual de prueba',
      durationMonths: 1,
      durationDays: null,
      priceClp: 19900,
      privateSessionsPerPeriod: 0,
      isActive: true,
    } as any);
    await plansRepo.save(p1);

    const p2 = plansRepo.create({
      gymId: gym.id,
      name: 'Plan Test Diario',
      description: 'Plan diario de prueba',
      durationMonths: null,
      durationDays: 30,
      priceClp: 9990,
      privateSessionsPerPeriod: 0,
      isActive: true,
    } as any);
    await plansRepo.save(p2);

    console.log('\n✅ Seed completado. Credenciales generadas:\n');
    for (const cu of createdUsers) {
      console.log(`- ${cu.email} -> ${cu.password}`);
    }

    console.log('\nRecuerda borrar o rotar estas contraseñas si son temporales.');
  } catch (err) {
    console.error('❌ Error en seed-staging-reset:', err);
  } finally {
    await app.close();
  }
}

bootstrap();
