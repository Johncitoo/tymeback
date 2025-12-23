import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GymsModule } from './gyms/gyms.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { PlansModule } from './plans/plans.module';
import { MachinesModule } from './machines/machines.module';
import { ExercisesModule } from './exercises/exercises.module';
import { MembershipsModule } from './memberships/memberships.module';
import { PaymentsModule } from './payments/payments.module';
import { PromotionsModule } from './promotions/promotions.module';
import { AttendanceModule } from './attendance/attendance.module';
import { SessionBurnsModule } from './session-burns/session-burns.module';
import { RoutinesModule } from './routines/routines.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { PrRecordsModule } from './pr-records/pr-records.module';
import { FilesModule } from './files/files.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CommunicationsModule } from './communications/communications.module';
import { ClientMetricsModule } from './client-metrics/client-metrics.module';
import { ProgressPhotosModule } from './progress-photos/progress-photos.module';
import { GymHoursModule } from './gym-hours/gym-hours.module';
import { NutritionAnamnesesModule } from './nutrition-anamneses/nutrition-anamneses.module';
import { BodyEvaluationsModule } from './body-evaluations/body-evaluations.module';
import { InbodyScansModule } from './inbody-scans/inbody-scans.module';
import { NutritionPlansModule } from './nutrition-plans/nutrition-plans.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { OpsModule } from './ops/ops.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AuthModule } from './auth/auth.module';
import { AuthSecurityModule } from './auth-security/auth-security.module';
import { TestModule } from './test/test.module';

@Module({
  imports: [
    // Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 👇 habilita @Cron()
    ScheduleModule.forRoot(),

    // Configuración de TypeORM
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'gym_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
      migrationsRun: false, // Deshabilitado temporalmente - columna ya agregada manualmente
      synchronize: false, // Desactivado - usamos bd.sql para el schema
      logging: process.env.DB_LOGGING === 'true',
      extra: {
        client_encoding: 'UTF8',
      },
    }),

    AuthModule,
    AuthSecurityModule,
    GymsModule,
    UsersModule,
    ClientsModule,
    PlansModule,
    MachinesModule,
    ExercisesModule,
    MembershipsModule,
    PaymentsModule,
    PromotionsModule,
    AttendanceModule,
    SessionBurnsModule,
    RoutinesModule,
    WorkoutsModule,
    PrRecordsModule,
    FilesModule,
    DashboardModule,
    CommunicationsModule,
    ClientMetricsModule,
    ProgressPhotosModule,
    GymHoursModule,
    NutritionAnamnesesModule,
    BodyEvaluationsModule,
    InbodyScansModule,
    NutritionPlansModule,
    NutritionModule,
    OpsModule,
    AppointmentsModule,
    TestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
