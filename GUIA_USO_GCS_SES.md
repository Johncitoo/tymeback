# 🚀 Guía de Uso: Google Cloud Storage y Amazon SES

Esta guía te ayudará a usar los servicios de almacenamiento de archivos (GCS) y envío de emails (SES) en el backend de TYME Gym.

---

## 📦 1. Google Cloud Storage (GCS)

### 1.1 Flujo de Subida de Archivos

El proceso de subida de archivos utiliza **URLs firmadas** para que el cliente suba directamente a GCS sin pasar por el backend:

```
Cliente → Backend (presign) → GCS (upload) → Backend (complete) → Base de datos
```

### 1.2 Endpoints Disponibles

#### Health Check
```http
GET /files/health
```

**Respuesta exitosa**:
```json
{
  "status": "ok",
  "service": "Google Cloud Storage",
  "configured": true,
  "message": "GCS está configurado correctamente"
}
```

#### 1. Obtener URL Firmada
```http
POST /files/presign
Content-Type: application/json

{
  "filename": "profile-photo.jpg",
  "contentType": "image/jpeg",
  "sizeBytes": 2048000,
  "purpose": "profile_photo",
  "gymId": "gym-123",
  "uploaderId": "user-456"
}
```

**Respuesta**:
```json
{
  "fileId": "f123-456",
  "uploadUrl": "https://storage.googleapis.com/...",
  "expiresAt": "2024-01-15T10:30:00Z",
  "key": "gyms/gym-123/profiles/f123-456.jpg"
}
```

#### 2. Subir Archivo a GCS

Usa la `uploadUrl` para subir el archivo directamente desde el frontend:

```javascript
// Frontend (React/TypeScript)
const file = document.getElementById('fileInput').files[0];

const response = await fetch(uploadUrl, {
  method: 'PUT',
  headers: {
    'Content-Type': file.type,
  },
  body: file,
});

if (response.ok) {
  console.log('Archivo subido correctamente');
}
```

#### 3. Completar la Subida
```http
POST /files/complete
Content-Type: application/json

{
  "fileId": "f123-456",
  "makePublic": false
}
```

**Respuesta**:
```json
{
  "id": "f123-456",
  "key": "gyms/gym-123/profiles/f123-456.jpg",
  "url": "https://storage.googleapis.com/...",
  "status": "READY",
  "mimeType": "image/jpeg",
  "sizeBytes": 2048000,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### 4. Listar Archivos
```http
GET /files?gymId=gym-123&purpose=profile_photo&limit=10&offset=0
```

**Respuesta**:
```json
{
  "data": [
    {
      "id": "f123-456",
      "key": "gyms/gym-123/profiles/f123-456.jpg",
      "url": "https://storage.googleapis.com/...",
      "purpose": "profile_photo",
      "mimeType": "image/jpeg",
      "sizeBytes": 2048000,
      "status": "READY"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

#### 5. Obtener URL de Descarga Temporal
```http
GET /files/:fileId/download-url
```

**Respuesta**:
```json
{
  "url": "https://storage.googleapis.com/...",
  "expiresAt": "2024-01-15T11:00:00Z"
}
```

#### 6. Eliminar Archivo (Soft Delete)
```http
DELETE /files/:fileId
```

### 1.3 Tipos de Archivo Permitidos (`purpose`)

- `profile_photo` - Foto de perfil de usuario
- `progress_photo` - Foto de progreso de cliente
- `inbody_scan` - Escaneo InBody
- `exercise_video` - Video de ejercicio
- `exercise_image` - Imagen de ejercicio
- `nutrition_plan` - Plan nutricional (PDF)
- `client_document` - Documento del cliente
- `routine_pdf` - Rutina exportada como PDF
- `other` - Otros archivos

### 1.4 Límites

- **Tamaño máximo**: 10 MB (configurable en `.env` con `GCS_MAX_FILE_SIZE_MB`)
- **Tipos MIME permitidos**:
  - Imágenes: `image/jpeg`, `image/png`, `image/webp`
  - Documentos: `application/pdf`, `.docx`, `.xlsx`

### 1.5 Ejemplo Completo en Frontend

```typescript
// services/fileUpload.service.ts
export class FileUploadService {
  private readonly API_URL = 'http://localhost:3000';

  async uploadFile(
    file: File,
    purpose: string,
    gymId: string,
    uploaderId: string
  ): Promise<string> {
    // 1. Obtener URL firmada
    const presignResponse = await fetch(`${this.API_URL}/files/presign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        purpose,
        gymId,
        uploaderId,
      }),
    });

    const { fileId, uploadUrl } = await presignResponse.json();

    // 2. Subir archivo a GCS
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('Error al subir el archivo');
    }

    // 3. Completar la subida
    const completeResponse = await fetch(`${this.API_URL}/files/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        fileId,
        makePublic: false,
      }),
    });

    const fileData = await completeResponse.json();
    return fileData.url;
  }
}

// Uso en un componente
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    setUploading(true);
    const url = await fileUploadService.uploadFile(
      file,
      'profile_photo',
      user.gymId,
      user.id
    );
    console.log('Archivo subido:', url);
    // Actualizar UI con la nueva URL
  } catch (error) {
    console.error('Error:', error);
    toast.error('Error al subir el archivo');
  } finally {
    setUploading(false);
  }
};
```

---

## 📧 2. Amazon SES (Simple Email Service)

### 2.1 Health Check

```http
GET /api/communications/health
```

**Respuesta exitosa**:
```json
{
  "status": "ok",
  "service": "Amazon SES",
  "configured": true,
  "message": "SES está configurado correctamente",
  "dryRun": false
}
```

### 2.2 Uso del Servicio de Email

El servicio `SesMailerService` está disponible para inyectarse en cualquier módulo:

```typescript
import { Injectable } from '@nestjs/common';
import { SesMailerService } from '../communications/mailer/ses-mailer.service';

@Injectable()
export class MyService {
  constructor(private readonly mailer: SesMailerService) {}

  async sendWelcomeEmail(userEmail: string, userName: string) {
    const subject = '¡Bienvenido a TYME Gym!';
    const html = `
      <h1>¡Hola ${userName}!</h1>
      <p>Gracias por unirte a TYME Gym.</p>
      <p>Estamos emocionados de tenerte con nosotros.</p>
    `;
    const text = `Hola ${userName}! Gracias por unirte a TYME Gym.`;

    try {
      const messageId = await this.mailer.send(userEmail, subject, html, text);
      console.log('Email enviado:', messageId);
    } catch (error) {
      console.error('Error al enviar email:', error);
    }
  }
}
```

### 2.3 Métodos Disponibles

#### `send()` - Envío Individual

```typescript
await this.mailer.send(
  'user@example.com',         // to: destinatario
  'Bienvenido a TYME Gym',    // subject: asunto
  '<h1>Hola</h1>',            // html: contenido HTML
  'Hola'                       // text: contenido texto plano (opcional)
);
```

**Retorna**: `Promise<string>` (messageId de SES)

#### `sendBulk()` - Envío Masivo

```typescript
const recipients = [
  'user1@example.com',
  'user2@example.com',
  'user3@example.com',
  // ... hasta 50 por llamada (se hace chunking automático)
];

const results = await this.mailer.sendBulk(
  recipients,
  'Recordatorio de Membresía',
  '<p>Tu membresía vence pronto</p>',
  'Tu membresía vence pronto'
);

// results: Array<{to, messageId, status, error}>
results.forEach(result => {
  if (result.status === 'SUCCESS') {
    console.log(`✅ Enviado a ${result.to}: ${result.messageId}`);
  } else {
    console.error(`❌ Error enviando a ${result.to}: ${result.error}`);
  }
});
```

### 2.4 Templates de Email

El sistema incluye un sistema de plantillas (templates) que permite:
- Crear plantillas HTML reutilizables
- Usar variables dinámicas (`{nombre}`, `{email}`, etc.)
- Versionar plantillas
- Probar antes de enviar

#### Crear Template

```http
POST /api/communications/templates
Content-Type: application/json

{
  "name": "welcome",
  "description": "Email de bienvenida para nuevos usuarios",
  "subject": "¡Bienvenido a TYME Gym, {nombre}!",
  "htmlBody": "<h1>Hola {nombre}!</h1><p>Tu email es {email}</p>",
  "textBody": "Hola {nombre}! Tu email es {email}",
  "purpose": "welcome",
  "variables": ["nombre", "email"],
  "gymId": "gym-123"
}
```

#### Enviar Email de Prueba

```http
POST /api/communications/test-send
Content-Type: application/json

{
  "templateId": "tmpl-123",
  "toEmail": "test@example.com",
  "variables": {
    "nombre": "Juan",
    "email": "juan@example.com"
  }
}
```

### 2.5 Campañas de Email

#### Crear Campaña

```http
POST /api/communications/campaigns
Content-Type: application/json

{
  "name": "Recordatorio Membresías Enero",
  "description": "Recordar a clientes que su membresía vence en enero",
  "templateId": "tmpl-123",
  "targetAudience": "active_members",
  "filters": {
    "membershipExpiringIn": 30
  },
  "gymId": "gym-123"
}
```

#### Programar Campaña

```http
PATCH /api/communications/campaigns/:id/schedule
Content-Type: application/json

{
  "scheduledAt": "2024-01-20T10:00:00Z"
}
```

#### Enviar Campaña Inmediatamente

```http
PATCH /api/communications/campaigns/:id/send-now?gymId=gym-123
```

### 2.6 Modo DRY_RUN

Para desarrollo local, activa el modo DRY_RUN en `.env`:

```bash
EMAIL_DRY_RUN=true
```

En este modo:
- No se enviarán emails reales
- Los emails se registrarán en los logs
- Útil para pruebas sin consumir cuota de SES

### 2.7 Recordatorios Automáticos

El sistema incluye un cron job que envía recordatorios automáticos:

- **Membresías por vencer**: 7, 3 y 1 día antes
- **Citas programadas**: 24 horas antes
- **Seguimiento de progreso**: Semanal o mensual

```typescript
// Se ejecuta automáticamente cada día a las 9 AM
@Cron(CronExpression.EVERY_DAY_AT_9AM)
async checkMembershipReminders() {
  // Lógica en CommunicationsService
}
```

### 2.8 Buenas Prácticas

1. **Siempre incluir versión texto plano** (`text`) además de HTML
2. **Usar variables en templates** en lugar de hardcodear
3. **Incluir link de unsubscribe** en emails de marketing
4. **Monitorear bounces y complaints** en AWS CloudWatch
5. **Respetar límites de SES**:
   - Sandbox: 200 emails/día, 1/segundo
   - Producción: Solicitar aumento de límite si necesario

### 2.9 Ejemplo: Sistema de Notificaciones

```typescript
// notifications.service.ts
import { Injectable } from '@nestjs/common';
import { SesMailerService } from '../communications/mailer/ses-mailer.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly mailer: SesMailerService) {}

  async notifyMembershipExpiring(client: Client, daysLeft: number) {
    const subject = `Tu membresía vence en ${daysLeft} días`;
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Hola ${client.firstName},</h2>
        <p>Te recordamos que tu membresía en TYME Gym vence en <strong>${daysLeft} días</strong>.</p>
        <p>Fecha de vencimiento: <strong>${client.membershipExpiry.toLocaleDateString()}</strong></p>
        <p>Para renovar tu membresía, visita nuestra recepción o contáctanos.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          TYME Gym - Tu salud es nuestra prioridad<br>
          <a href="http://localhost:5173/unsubscribe">Cancelar suscripción</a>
        </p>
      </div>
    `;

    await this.mailer.send(client.email, subject, html);
  }

  async notifyAppointmentConfirmed(client: Client, appointment: Appointment) {
    const subject = 'Cita confirmada en TYME Gym';
    const html = `
      <h2>Cita Confirmada</h2>
      <p>Hola ${client.firstName},</p>
      <p>Tu cita ha sido confirmada para:</p>
      <ul>
        <li><strong>Fecha:</strong> ${appointment.date.toLocaleDateString()}</li>
        <li><strong>Hora:</strong> ${appointment.time}</li>
        <li><strong>Con:</strong> ${appointment.trainer.name}</li>
      </ul>
      <p>¡Te esperamos!</p>
    `;

    await this.mailer.send(client.email, subject, html);
  }
}
```

---

## 🧪 3. Testing

### 3.1 Verificar Configuración

```bash
# Health check de GCS
curl http://localhost:3000/files/health

# Health check de SES
curl http://localhost:3000/api/communications/health
```

### 3.2 Probar Subida de Archivo

```bash
# 1. Obtener URL firmada
curl -X POST http://localhost:3000/files/presign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "filename": "test.jpg",
    "contentType": "image/jpeg",
    "sizeBytes": 100000,
    "purpose": "profile_photo",
    "gymId": "gym-123",
    "uploaderId": "user-456"
  }'

# 2. Subir archivo (usa la uploadUrl de la respuesta anterior)
curl -X PUT "UPLOAD_URL_FROM_STEP_1" \
  -H "Content-Type: image/jpeg" \
  --data-binary @test.jpg

# 3. Completar subida
curl -X POST http://localhost:3000/files/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "fileId": "FILE_ID_FROM_STEP_1",
    "makePublic": false
  }'
```

### 3.3 Probar Envío de Email

```bash
curl -X POST http://localhost:3000/api/communications/test-send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "templateId": "welcome",
    "toEmail": "your-email@example.com",
    "variables": {
      "nombre": "Test User",
      "email": "test@example.com"
    }
  }'
```

---

## 🔧 4. Troubleshooting

### Error: "GCS not configured"

**Solución**:
1. Verifica que `GOOGLE_APPLICATION_CREDENTIALS` esté en `.env`
2. Verifica que el archivo JSON existe en la ruta especificada
3. Verifica que la Service Account tenga permisos correctos

### Error: "SES credentials not found"

**Solución**:
1. Verifica que `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY` estén en `.env`
2. Verifica que las credenciales sean válidas
3. Verifica que la región sea correcta

### Error: "Email not verified"

**Solución**:
- Si estás en Sandbox mode, verifica el email del destinatario en AWS SES
- Solicita salir de Sandbox mode para enviar a cualquier email

### Archivos no se suben

**Solución**:
1. Verifica el tamaño del archivo (máximo 10 MB)
2. Verifica el tipo MIME (solo algunos permitidos)
3. Revisa los logs del backend para más detalles

---

## 📚 5. Recursos

- [Google Cloud Storage Docs](https://cloud.google.com/storage/docs)
- [Amazon SES Docs](https://docs.aws.amazon.com/ses/)
- [Guía de Configuración Completa](./CONFIGURACION_GCS_SES.md)

---

¿Necesitas más ayuda? Contacta al equipo de desarrollo.
