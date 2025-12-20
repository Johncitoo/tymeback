# OPCIÓN 2: Deshabilitar Uniform Bucket-Level Access

## Qué hace esto:
- Permite ACLs individuales por archivo
- Puedes usar `file.makePublic()` en el código
- Similar a cómo funciona tu otro proyecto

## ADVERTENCIA:
⚠️ **Esto puede tardar hasta 90 días en surtir efecto según Google**
⚠️ Solo funciona si nadie ha configurado políticas IAM complejas

## Cómo hacerlo:

### Paso 1: Ir a la configuración del bucket
https://console.cloud.google.com/storage/browser/tyme-dev-uploads?project=tyme-473902

### Paso 2: Click en "PERMISSIONS"

### Paso 3: Buscar "Access control"
Verás algo como:
```
Access control: Uniform
```

### Paso 4: Click en "SWITCH TO FINE-GRAINED"

### Paso 5: Confirmar el cambio
- Lee las advertencias
- Confirma que entiendes que hay un período de gracia de 90 días

## Después de esto:
1. El código actual con `makePublic()` funcionará:
```typescript
await this.gcs.makePublic(this.bucket, key);
```

2. No necesitas URLs firmadas

3. Cada archivo puede tener permisos individuales

## Desventajas:
- Período de espera de hasta 90 días
- Gestión más compleja (permisos por archivo vs por bucket)
- No es el enfoque recomendado por Google (están migrando todo a Uniform)

## Cuándo usar esto:
- Si necesitas control granular por archivo
- Si algunos archivos deben ser públicos y otros privados
- Si quieres replicar exactamente el comportamiento de tu otro proyecto
