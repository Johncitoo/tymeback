import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { runMigration } from './scripts/migrate-routine-assignments';

async function bootstrap() {
  // Ejecutar migraciones antes de iniciar la app
  try {
    await runMigration();
  } catch (error) {
    console.error('⚠️  Error en migración, continuando con la app:', error);
  }

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS con múltiples orígenes permitidos
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ['http://localhost:5173'];

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (como Postman o curl)
      if (!origin) return callback(null, true);
      
      // En desarrollo, permitir cualquier localhost u origen local
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.')) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn('⚠️  CORS bloqueado para:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`\n🚀 Backend corriendo en: http://localhost:${port}`);
  console.log(`📚 API disponible en: http://localhost:${port}/api\n`);
}
bootstrap();
