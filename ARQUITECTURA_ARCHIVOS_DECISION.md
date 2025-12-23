# ⚠️ DECISIÓN DE ARQUITECTURA: Archivos Públicos vs Privados

## ❌ LO QUE NO HACER

**NUNCA hacer público el bucket `tyme-dev-uploads`:**
- ❌ No agregar `allUsers:Storage Object Viewer` al bucket principal
- ❌ Esto expondría TODOS los archivos (certificados, PDFs, documentos sensibles)
- ❌ El control JWT + gym_id se vuelve inútil si las URLs son públicas

## ✅ Opciones Correctas

### Opción A: TODO PRIVADO (Simple y Seguro) - ACTUAL

**Qué significa:**
- Bucket `tyme-dev-uploads` permanece 100% privado
- Todos los archivos (incluyendo avatares) usan signed URLs temporales
- Cada acceso requiere autenticación JWT + validación gym_id

**Pros:**
- ✅ Máxima seguridad y control
- ✅ Simple de implementar (ya está listo)
- ✅ URLs temporales (10 min) renovables automáticamente
- ✅ Control granular de acceso
- ✅ Auditable (cada descarga pasa por backend)

**Contras:**
- ⚠️ URLs expiran cada 10 minutos
- ⚠️ Frontend necesita renovar URLs (hook ya implementado)
- ⚠️ Ligero overhead en backend por cada acceso

**Uso en frontend:**
```typescript
// Hook automático con renovación
const { url, loading } = useFileUrl(user.avatarFileId);

<Avatar>
  <AvatarImage src={url} />
</Avatar>
```

**Estado actual:** ✅ Implementado y funcionando

---

### Opción B: Buckets Separados (Enterprise Grade)

**Arquitectura:**
- Bucket `tyme-public-assets`: Solo avatares/imágenes no sensibles (PÚBLICO)
- Bucket `tyme-dev-uploads`: Documentos/certificados/privados (PRIVADO)

**Pros:**
- ✅ URLs permanentes para avatares (nunca expiran)
- ✅ Documentos sensibles 100% privados
- ✅ Separación clara de responsabilidades
- ✅ Mejor performance para assets públicos (cacheable)

**Contras:**
- ⚠️ Requiere crear y configurar segundo bucket
- ⚠️ Lógica de backend más compleja
- ⚠️ Migración de avatares existentes
- ⚠️ Gestión de dos buckets en GCP

**Cambios necesarios:**

1. **Crear bucket público:**
```bash
gsutil mb -c STANDARD -l us-central1 gs://tyme-public-assets
gsutil iam ch allUsers:objectViewer gs://tyme-public-assets
```

2. **Modificar FilesService:**
```typescript
constructor() {
  this.publicBucket = 'tyme-public-assets';
  this.privateBucket = 'tyme-dev-uploads';
}

uploadDirectToGCS(params) {
  const isPublic = ['AVATAR', 'EXERCISE_IMAGE', 'MACHINE_IMAGE'].includes(purpose);
  const bucket = isPublic ? this.publicBucket : this.privateBucket;
  
  // Si es público, guardar URL estática
  // Si es privado, no guardar URL (usar signed on-demand)
}
```

3. **Migrar avatares existentes:**
```sql
-- Script de migración necesario
```

**Estado:** ⏳ No implementado

---

## 🎯 Recomendación

**Para tu caso (multi-gym con datos sensibles):**

### Usar Opción A (TODO PRIVADO) por ahora porque:

1. ✅ Ya está implementado y funcionando
2. ✅ Máxima seguridad sin configuración adicional
3. ✅ Hook de frontend maneja renovación automática
4. ✅ Control total de acceso
5. ✅ Menos complejidad operacional

### Migrar a Opción B solo si:
- Necesitas URLs permanentes para avatares (SEO, caché agresivo)
- Tienes muchos accesos concurrentes a avatares
- Quieres CDN frente a assets públicos
- El overhead de renovación de signed URLs se vuelve significativo

---

## 📋 Estado Actual del Sistema

### Backend:
- ✅ Endpoint `/files/:id/download-url` con JWT + gym_id
- ✅ Signed URLs V4 (10 min de validez)
- ✅ No guarda signed URLs en DB
- ✅ Distinción público/privado en purpose

### Frontend:
- ✅ Hook `useFileUrl` con auto-renovación
- ✅ Hook `useFileUrls` para galerías
- ⏳ Pendiente: Integrar hooks en UserManager

### Base de Datos:
- ✅ Archivos privados sin public_url
- ✅ Archivos públicos con URL estática (no funcionarán hasta bucket público O usar signed URLs)

---

## 🔄 Próximos Pasos

### Si mantienes Opción A (Recomendado):
1. Actualizar UserManager para usar `useFileUrl` en avatares
2. Verificar que todos los avatares existentes funcionen
3. Testear certificados/documentos privados

### Si quieres Opción B (Buckets separados):
1. Crear bucket `tyme-public-assets`
2. Modificar FilesService para lógica dual-bucket
3. Script de migración de avatares existentes
4. Actualizar URLs en base de datos
5. Testear ambos flujos (público y privado)

---

## 🔐 Seguridad

### ✅ Arquitectura Actual (Opción A):
- Todos los archivos requieren autenticación
- Control de acceso a nivel de aplicación
- URLs temporales no compartibles después de expirar
- Auditable via logs de backend

### ⚠️ Si usas Opción B:
- Solo aplicar permisos públicos a bucket de assets
- Nunca hacer público el bucket de documentos
- Rol mínimo: `storage.objects.get` (no `Storage Object Viewer` completo)
- Considerar Public Access Prevention en bucket privado
