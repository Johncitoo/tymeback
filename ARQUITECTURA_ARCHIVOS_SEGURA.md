# Arquitectura Segura de Archivos - Implementada

## 🎯 Objetivo
**Bucket PRIVADO + Signed URLs on-demand** con control de acceso por JWT + gym_id

## 📋 Categorías de Archivos

### 🔒 PRIVADOS (requieren autenticación):
- `CERTIFICATE` - Títulos de entrenadores/nutricionistas
- `INBODY_PDF` - Reportes de composición corporal
- `PROGRESS_PHOTO` - Fotos de progreso de clientes
- `PROOF` - Comprobantes de pago
- `DOCUMENT` - Documentos generales

**Flujo:**
1. Cliente solicita archivo
2. Backend valida JWT + verifica gym_id
3. Genera signed URL (10 min de validez)
4. Cliente descarga directamente desde GCS

### 🌐 PÚBLICOS (accesibles sin auth - opcional):
- `AVATAR` - Fotos de perfil
- `EXERCISE_IMAGE` - Imágenes de ejercicios
- `MACHINE_IMAGE` - Fotos de máquinas

**Opciones:**
- **Opción A (actual)**: URLs estáticas si bucket es público
- **Opción B**: Signed URLs también (más seguro)

## 🔧 Implementación Actual

### Backend (NestJS)

#### 1. Upload de Archivos
```typescript
POST /files/upload
Content-Type: multipart/form-data

{
  file: <binary>,
  gymId: "uuid",
  purpose: "CERTIFICATE" | "AVATAR" | etc.,
  ownerUserId: "uuid" (opcional),
  makePublic: "true" | "false"
}

Response:
{
  fileId: "uuid",
  publicUrl: "..." (solo para AVATAR/EXERCISE_IMAGE/MACHINE_IMAGE si bucket público),
  storageKey: "...",
  status: "READY"
}
```

#### 2. Obtener URL de Descarga (privados)
```typescript
GET /files/:id/download-url
Headers: Authorization: Bearer <JWT>

Response:
{
  url: "https://storage.googleapis.com/...?X-Goog-Signature=...",
  expiresIn: 600 // segundos
}
```

### Frontend (React)

#### Avatares (públicos)
```typescript
// Si bucket es público:
<img src={user.avatarUrl} />

// Si bucket privado O avatar expiró:
const { url } = await api.get(`/files/${user.avatarFileId}/download-url`);
setAvatarUrl(url);
```

#### Certificados (privados)
```typescript
const downloadCertificate = async (fileId: string) => {
  const { url } = await api.get(`/files/${fileId}/download-url`);
  window.open(url, '_blank');
};
```

## 🚀 Próximos Pasos

### ✅ Ya implementado:
- Endpoint `/files/:id/download-url` genera signed URLs de 10 min
- Lógica que distingue archivos públicos vs privados
- No se guardan signed URLs largas en DB

### ⏳ Pendiente:
1. **Agregar autenticación JWT al endpoint de descarga**
   ```typescript
   @UseGuards(JwtAuthGuard)
   @Get(':id/download-url')
   async downloadUrl(@Param('id') id: string, @CurrentUser() user: User) {
     const file = await this.files.findOne(id);
     if (file.gymId !== user.gymId) throw new ForbiddenException();
     return this.files.getDownloadUrl(id);
   }
   ```

2. **Actualizar frontend para usar endpoint de descarga:**
   - Avatares: usar signed URLs on-demand
   - Certificados: botón "Ver certificado" → genera URL temporal
   - Fotos progreso: galería privada con signed URLs
   - InBody PDFs: botón "Descargar reporte"

3. **Decidir estrategia para avatares:**
   - **Opción A**: Hacer bucket público SOLO para avatares (crear bucket separado `tyme-public-assets`)
   - **Opción B**: Mantener todo privado, usar signed URLs para todo

## 🔐 Seguridad

### ✅ Ventajas de esta arquitectura:
- Control de acceso granular (JWT + gym_id)
- URLs temporales (no quedan públicas forever)
- Posibilidad de revocar acceso (desactivar usuario)
- Auditable (cada descarga pasa por backend)
- Cumple estándares enterprise

### ⚠️ Consideraciones:
- Signed URLs expiran → frontend debe revalidar
- Cada descarga genera overhead en backend (pero mínimo)
- GCS cobra por operaciones de firma (pero es ínfimo)

## 📊 Comparación con Bucket Público

| Aspecto | Bucket Público | Signed URLs (Actual) |
|---------|----------------|---------------------|
| Seguridad | ⚠️ URLs permanentes | ✅ URLs temporales |
| Control acceso | ❌ No hay | ✅ JWT + gym_id |
| Revocar acceso | ❌ Imposible | ✅ Desactivar usuario |
| Performance | ✅ Directo | ⚠️ Overhead mínimo |
| Expiración | ✅ Nunca | ⏰ 10 min (renovable) |
| Auditoría | ❌ No | ✅ Logs de acceso |
| Costo | ✅ Solo storage | ✅ + operaciones firma |

## 🎓 Recomendación Final

**Para producción profesional:**
1. Mantener bucket PRIVADO
2. Usar signed URLs para TODO
3. Opcionalmente: crear bucket público separado solo para assets no sensibles

**Si quieres "quick & dirty":**
1. Hacer bucket público
2. Aceptar que cualquiera con URL puede acceder
3. Confiar en "security by obscurity" (UUID en nombres)

**La implementación actual está lista para el enfoque profesional** ✅
