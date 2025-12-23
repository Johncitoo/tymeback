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
    bodyParser: true,
  });

  // NOTA: NO usar body-parser middleware aquí porque interfiere con multipart/form-data
  // NestJS ya incluye body-parser por defecto cuando bodyParser: true
  // Multer (FileInterceptor) maneja multipart/form-data automáticamente

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

  // Agregar dominio personalizado
  const customDomains = [
    'https://somostyme.cl',
    'https://www.somostyme.cl',
    'http://somostyme.cl',
    'http://www.somostyme.cl',
    // Vercel deployments
    'https://tyme-front-test-git-dev-johncitoos-projects.vercel.app',
    'https://tyme-front-test-7qrzrtdtl-johncitoos-projects.vercel.app',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (como Postman o curl)
      if (!origin) return callback(null, true);
      
      // En desarrollo, permitir cualquier localhost u origen local
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.')) {
        return callback(null, true);
      }
      
      // Permitir dominios personalizados
      if (customDomains.includes(origin)) {
        return callback(null, true);
      }
      
      // Permitir orígenes configurados en FRONTEND_URL
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn('⚠️  CORS bloqueado para:',);
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
