# TYME Backend - Sistema de Gestión de Gimnasios

Backend completo para sistema de gestión de gimnasios multi-tenant con NestJS, TypeORM y PostgreSQL.

## 🚀 Inicio Rápido

### 1. Requisitos Previos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

### 2. Instalación

```bash
# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env
```

### 3. Configurar Base de Datos

Edita el archivo `.env` con tus credenciales de PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=gym_db
```

### 4. Crear Base de Datos

```bash
# Crear la base de datos
psql -U postgres -c "CREATE DATABASE gym_db;"

# Ejecutar el script SQL
psql -U postgres -d gym_db -f ../BD/bd.sql
```

### 5. Ejecutar la Aplicación

```bash
# Desarrollo con hot-reload
npm run start:dev

# Producción
npm run build
npm run start:prod
```

La API estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── appointments/      # Gestión de citas
│   ├── attendance/        # Control de asistencia
│   ├── auth/             # Autenticación y autorización
│   ├── body-evaluations/ # Evaluaciones corporales
│   ├── clients/          # Gestión de clientes
│   ├── communications/   # Emails y campañas
│   ├── dashboard/        # Dashboard y estadísticas
│   ├── exercises/        # Catálogo de ejercicios
│   ├── files/            # Gestión de archivos
│   ├── gym-hours/        # Horarios del gimnasio
│   ├── gyms/             # Multi-tenant gyms
│   ├── inbody-scans/     # Escaneos InBody
│   ├── machines/         # Máquinas y mantenimiento
│   ├── memberships/      # Membresías y sesiones
│   ├── nutrition/        # Nutrición y planes
│   ├── ops/              # Operaciones y CRON jobs
│   ├── payments/         # Pagos y facturación
│   ├── plans/            # Planes y promociones
│   ├── progress-photos/  # Fotos de progreso
│   ├── routines/         # Rutinas de entrenamiento
│   ├── users/            # Usuarios base
│   └── workouts/         # Registro de entrenamientos
├── dist/                 # Build de producción
└── test/                 # Tests E2E y unitarios
```

## 🔐 Autenticación

El sistema usa JWT para autenticación. Los roles disponibles son:

- **ADMIN**: Acceso total al sistema
- **TRAINER**: Gestión de clientes y rutinas
- **NUTRITIONIST**: Gestión de planes nutricionales
- **CLIENT**: Acceso a su perfil y datos

### Endpoints Principales

```
POST   /api/auth/login                 # Login
POST   /api/auth/activate               # Activar cuenta
POST   /api/auth/forgot-password        # Recuperar contraseña
GET    /api/auth/me                     # Usuario actual
```

## 📊 Módulos Principales

### Gestión de Usuarios
- Registro multi-rol (Admin, Trainer, Nutritionist, Client)
- Perfiles específicos por rol
- Activación de cuenta por token
- Reset de contraseña

### Asistencia
- Check-in/Check-out con QR
- Auto-checkout después de 2 horas
- Historial de asistencia
- Métricas de uso

### Membresías y Pagos
- Planes flexibles (mensual, trimestral, anual)
- Sesiones ilimitadas o limitadas
- Registro de pagos
- Items de pago detallados

### Rutinas y Entrenamientos
- Rutinas personalizadas por cliente
- Ejercicios con músculos target
- Registro de PRs (Personal Records)
- Seguimiento de progreso

### Nutrición
- Anamnesis nutricional
- Planes alimenticios personalizados
- Evaluaciones corporales
- Integración con InBody

### Comunicaciones
- Templates de email personalizables
- Campañas masivas
- Recordatorios automáticos
- Logs de envío

### Horarios y Citas
- Horarios semanales configurables
- Overrides para días especiales
- Sistema de citas para trainers/nutritionists
- Disponibilidad y permisos del staff

## 🛠️ Scripts Disponibles

```bash
npm run start          # Iniciar en modo producción
npm run start:dev      # Desarrollo con hot-reload
npm run start:debug    # Desarrollo con debugger
npm run build          # Compilar para producción
npm run test           # Ejecutar tests unitarios
npm run test:e2e       # Ejecutar tests E2E
npm run lint           # Linter
npm run format         # Formatear código
```

## 🔧 Configuración

### Variables de Entorno

Ver `.env.example` para todas las variables disponibles.

### TypeORM

La aplicación usa TypeORM con sincronización automática en desarrollo:

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  synchronize: process.env.NODE_ENV !== 'production',
  // ... más configuración
})
```

⚠️ **IMPORTANTE**: En producción, `synchronize` debe ser `false` y usar migraciones.

## 🐛 Troubleshooting

### Error: "Can't resolve dependencies"

Asegúrate de que `TypeOrmModule.forRoot()` esté configurado en `app.module.ts` y que todas las entidades estén importadas en sus módulos respectivos.

### Error de conexión a PostgreSQL

Verifica:
1. PostgreSQL está corriendo
2. Credenciales en `.env` son correctas
3. Base de datos existe
4. Usuario tiene permisos

### Errores de TypeScript

```bash
# Limpiar y recompilar
rm -rf dist node_modules
npm install
npm run build
```

## 📝 Notas Importantes

1. **Multi-Tenant**: Cada gym es independiente con sus propios datos
2. **Zona Horaria**: Sistema configurado para `America/Santiago`
3. **Formato de Horas**: Se usa "HH:mm" (24 horas)
4. **Días de la Semana**: 0=Domingo, 6=Sábado (estándar JS)

## 🚀 Despliegue

### Producción

1. Configurar variables de entorno de producción
2. Compilar el proyecto: `npm run build`
3. Ejecutar migraciones de BD si es necesario
4. Iniciar: `npm run start:prod`

### Docker (Opcional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/main"]
```

## 📞 Soporte

Para problemas o preguntas, revisar la documentación completa o contactar al equipo de desarrollo.

## 📄 Licencia

Propietario - TYME © 2025
