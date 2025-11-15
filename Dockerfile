# ==========================================
# TYME Backend - Dockerfile (Desarrollo)
# ==========================================

# Etapa 1: Base con Node.js
FROM node:20-alpine AS base

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar package files
COPY package*.json ./

# ==========================================
# Etapa 2: Desarrollo
# ==========================================
FROM base AS development

# Instalar TODAS las dependencias (incluyendo dev)
RUN npm ci

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando para desarrollo con hot-reload
CMD ["npm", "run", "start:dev"]

# ==========================================
# Etapa 3: Build (para producción futura)
# ==========================================
FROM base AS builder

# Instalar dependencias
RUN npm ci

# Copiar código
COPY . .

# Build
RUN npm run build

# ==========================================
# Etapa 4: Producción (optimizada)
# ==========================================
FROM node:20-alpine AS production

WORKDIR /app

# Copiar solo package files
COPY package*.json ./

# Instalar SOLO dependencias de producción
RUN npm ci --only=production

# Copiar build desde etapa builder
COPY --from=builder /app/dist ./dist

# Usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

USER nestjs

EXPOSE 3000

# Comando para producción
CMD ["node", "dist/main"]
