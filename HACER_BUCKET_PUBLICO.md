# 🔓 Hacer Bucket Público - Instrucciones Paso a Paso

## Opción A: Via GCP Console (Recomendado - 2 minutos)

### Paso 1: Abrir la consola de GCS
Ir a: https://console.cloud.google.com/storage/browser/tyme-dev-uploads?project=tyme-473902

### Paso 2: Click en la pestaña "PERMISSIONS"
En la parte superior de la página, verás varias pestañas. Click en **"PERMISSIONS"**.

### Paso 3: Click en "GRANT ACCESS"
Botón azul en la parte superior de la tabla de permisos.

### Paso 4: Configurar el acceso público
- **New principals**: `allUsers`
- **Select a role**: `Cloud Storage` → `Storage Object Viewer`
- Click **"SAVE"**

### Paso 5: Confirmar
Aparecerá un warning de que estás haciendo el bucket público. Click en **"ALLOW PUBLIC ACCESS"**.

✅ **¡Listo!** Las URLs estáticas ahora funcionarán inmediatamente.

---

## Opción B: Via gcloud CLI (si tienes permisos de admin)

```bash
# 1. Autenticarse
gcloud auth login

# 2. Configurar proyecto
gcloud config set project tyme-473902

# 3. Otorgar acceso público de lectura
gsutil iam ch allUsers:objectViewer gs://tyme-dev-uploads

# 4. Verificar
gsutil iam get gs://tyme-dev-uploads
```

---

## Verificación

### Probar que funcionó:
```powershell
# Reemplazar con una URL real de tu bucket
Invoke-WebRequest -Uri "https://storage.googleapis.com/tyme-dev-uploads/68703e85-cfb2-441d-b00c-b4217b39416d/AVATAR/2025/12/ab3b4050-f08a-4572-8383-d48c81cba9fd.jpeg" -Method Head
```

**Antes**: 403 Forbidden ❌
**Después**: 200 OK ✅

---

## ¿Qué archivos serán accesibles?

### ✅ Archivos con URL estática en la BD:
- **AVATAR** - Fotos de perfil de usuarios
- **EXERCISE_IMAGE** - Imágenes de ejercicios
- **MACHINE_IMAGE** - Fotos de máquinas del gym

### 🔒 Archivos que seguirán privados (requieren autenticación):
- **CERTIFICATE** - Títulos de entrenadores (sin URL en BD)
- **INBODY_PDF** - Reportes de composición corporal (sin URL en BD)
- **PROGRESS_PHOTO** - Fotos de progreso de clientes (sin URL en BD)
- **PROOF** - Comprobantes de pago (sin URL en BD)
- **DOCUMENT** - Documentos generales (sin URL en BD)

**¿Por qué son privados si el bucket es público?**
Porque NO tienen `public_url` en la base de datos. El frontend nunca sabrá la URL directa. Solo se pueden obtener via:
```typescript
GET /files/:id/download-url
Authorization: Bearer <JWT>
```

Y el backend valida que:
1. El usuario esté autenticado
2. El usuario pertenezca al mismo gym que el archivo

---

## Seguridad

### ✅ Es seguro porque:
1. Los nombres de archivo tienen UUIDs aleatorios
2. Las rutas tienen el gym_id embebido
3. No se puede "listar" el contenido del bucket públicamente
4. Solo quien tiene la URL exacta puede acceder
5. Los archivos sensibles NO tienen URL pública

### ⚠️ Consideraciones:
- Si alguien obtiene una URL de avatar, puede compartirla
- Los avatares son **intencionalmente públicos** (como Twitter, LinkedIn, etc.)
- Si necesitas revocar acceso a un avatar específico, elimínalo del bucket

---

## Después de hacer el bucket público

### 1. Refresca Gestión de Usuarios
Los avatares deberían cargar inmediatamente (sin reload del backend).

### 2. Verifica en la consola del navegador
```javascript
// Busca errores 403 en Network tab
// Deberían desaparecer
```

### 3. Sube un nuevo avatar
Debería funcionar end-to-end:
- Registro de cliente con avatar
- Avatar visible en tabla
- Avatar visible en detalles

---

## Rollback (si algo sale mal)

### Para revertir a bucket privado:
1. GCP Console → Storage → tyme-dev-uploads → PERMISSIONS
2. Buscar `allUsers` en la lista
3. Click en el icono de eliminar (🗑️)
4. Confirmar

Todos los avatares volverán a dar 403.

---

## Alternativa: Bucket Separado (Mejor Práctica Enterprise)

Si quieres mantener `tyme-dev-uploads` 100% privado:

### 1. Crear nuevo bucket público solo para assets:
```bash
gsutil mb -c STANDARD -l us-central1 gs://tyme-public-assets
gsutil iam ch allUsers:objectViewer gs://tyme-public-assets
```

### 2. Modificar backend para usar bucket correcto según purpose:
```typescript
// files.service.ts constructor
this.publicBucket = 'tyme-public-assets';
this.privateBucket = 'tyme-dev-uploads';

// uploadDirectToGCS
const bucket = ['AVATAR', 'EXERCISE_IMAGE', 'MACHINE_IMAGE'].includes(purpose) 
  ? this.publicBucket 
  : this.privateBucket;
```

### 3. Migrar avatares existentes:
```bash
gsutil -m cp -r gs://tyme-dev-uploads/**/*AVATAR* gs://tyme-public-assets/
```

Pero esto es overkill para tu caso de uso actual. **Hacer el bucket público es suficiente.**
