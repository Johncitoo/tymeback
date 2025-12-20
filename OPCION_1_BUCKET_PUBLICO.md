# OPCIÓN 1: Hacer el Bucket Público (RECOMENDADO)

## Por qué es mejor:
- ✅ URLs estáticas que nunca expiran
- ✅ No necesitas regenerar URLs cada semana
- ✅ Más rápido (no necesita firma criptográfica)
- ✅ Compatible con CDNs y caché
- ✅ Similar a tu otro proyecto

## Cómo hacerlo:

### Paso 1: Ir a la consola de GCS
https://console.cloud.google.com/storage/browser/tyme-dev-uploads?project=tyme-473902

### Paso 2: Click en la pestaña "PERMISSIONS"

### Paso 3: Click en "GRANT ACCESS"

### Paso 4: Configurar permisos
- **New principals**: `allUsers`
- **Role**: `Storage Object Viewer`
- **Condition**: (dejar vacío)

### Paso 5: Click "SAVE"

## Después de esto:
1. Todas las URLs estáticas funcionarán: 
   `https://storage.googleapis.com/tyme-dev-uploads/...`

2. No necesitas URLs firmadas

3. Modificar el código para usar URLs estáticas:

```typescript
// En files.service.ts, línea 228-252
// CAMBIAR DE:
publicUrl = await this.gcs.getSignedDownloadUrl({
  bucket: this.bucket,
  key,
  expiresIn: 7 * 24 * 60 * 60,
});

// A:
publicUrl = `https://storage.googleapis.com/${this.bucket}/${encodeURIComponent(key)}`;
```

4. Ejecutar script para regenerar URLs estáticas:
```bash
node regenerate-avatar-urls-static.js
```

## Seguridad:
- Los archivos son accesibles solo si conoces la URL exacta
- Los nombres de archivo tienen UUIDs aleatorios
- Nadie puede "listar" el contenido del bucket
- Similar a S3 con "Block Public Access" OFF pero sin listado

## Cuándo NO hacerlo:
- Si los archivos contienen información extremadamente sensible
- Si necesitas control de acceso por usuario
- Si necesitas revocar acceso a archivos específicos
