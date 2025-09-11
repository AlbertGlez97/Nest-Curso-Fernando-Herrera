# ===================================================================
# DOCKERFILE MULTI-STAGE PARA APLICACIÓN NEST.JS POKÉDEX
# ===================================================================
# 
# ¿QUÉ ES UN BUILD MULTI-STAGE?
# Es una técnica avanzada de Docker que utiliza múltiples imágenes FROM
# en un solo Dockerfile para optimizar el tamaño final y la seguridad.
# 
# VENTAJAS DEL MULTI-STAGE BUILD:
# 1. IMAGEN MÁS PEQUEÑA: Solo incluye lo necesario para producción
# 2. MAYOR SEGURIDAD: No incluye herramientas de desarrollo
# 3. MEJOR RENDIMIENTO: Separación clara entre build y runtime
# 4. CACHE EFICIENTE: Cada stage puede ser cacheado independientemente
# ===================================================================

# ========== STAGE 1: INSTALACIÓN DE DEPENDENCIAS ==========
# Instalar dependencias solo cuando sea necesario
# AS deps: Nombra este stage como "deps" para referenciarlo después
FROM node:18-alpine3.15 AS deps

# Instalar dependencias del sistema necesarias para compilar módulos nativos
# --no-cache: No guarda cache de paquetes para mantener la imagen pequeña
# libc6-compat: Biblioteca de compatibilidad necesaria para algunos módulos de Node.js
# python3, make, g++: Herramientas de compilación para módulos nativos
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++

# Establecer directorio de trabajo para este stage
WORKDIR /app

# Copiar solo los archivos de dependencias (para aprovechar el cache de Docker)
# package.json: Define las dependencias del proyecto
# yarn.lock: Lockfile que garantiza versiones exactas de dependencias
COPY package.json yarn.lock* ./

# Instalar dependencias usando el lockfile si existe, sino instalar normalmente
# Verificar si yarn.lock existe, si no, crear uno nuevo
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else yarn install && yarn install --frozen-lockfile; fi

# ========== STAGE 2: CONSTRUCCIÓN DE LA APLICACIÓN ==========
# Construir la aplicación con las dependencias ya instaladas
FROM node:18-alpine3.15 AS builder

# Establecer directorio de trabajo para el build
WORKDIR /app

# Copiar node_modules del stage anterior (reutiliza las dependencias instaladas)
# --from=deps: Copia desde el stage llamado "deps"
# Esto evita reinstalar dependencias y aprovecha el cache
COPY --from=deps /app/node_modules ./node_modules

# Copiar todo el código fuente de la aplicación
# El "." representa el directorio actual donde está el Dockerfile
COPY . .

# Compilar la aplicación TypeScript a JavaScript
# Genera el directorio /dist con el código optimizado para producción
RUN yarn build

# ========== STAGE 3: IMAGEN DE PRODUCCIÓN ==========
# Imagen final de producción, copia archivos necesarios y ejecuta la aplicación
FROM node:18-alpine3.15 AS runner

# Establecer directorio de trabajo para la aplicación en producción
# /usr/src/app: Directorio estándar para aplicaciones en contenedores
WORKDIR /usr/src/app

# Copiar archivos de configuración de dependencias
# Solo necesitamos estos archivos para instalar dependencias de producción
COPY package.json yarn.lock ./

# Instalar SOLO las dependencias de producción
# --prod: Excluye devDependencies, reduciendo significativamente el tamaño
# Las herramientas de desarrollo (TypeScript, testing, etc.) no son necesarias
RUN yarn install --prod

# Copiar el código compilado desde el stage builder
# --from=builder: Copia desde el stage llamado "builder"
# /app/dist: Directorio donde se compiló la aplicación
# ./dist: Destino en la imagen de producción
COPY --from=builder /app/dist ./dist

# ========== CÓDIGO COMENTADO (CONFIGURACIONES OPCIONALES) ==========
# Las siguientes líneas están comentadas pero muestran configuraciones adicionales:

# # Crear directorio específico para la aplicación
# RUN mkdir -p ./pokedex

# # Copiar archivos adicionales si fueran necesarios
# COPY --from=builder ./app/dist/ ./app
# COPY ./.env ./app/.env

# # Configuración de seguridad: usuario sin privilegios
# RUN adduser --disabled-password pokeuser
# RUN chown -R pokeuser:pokeuser ./pokedex
# USER pokeuser

# # Exponer puerto de la aplicación
# EXPOSE 3000

# ========== COMANDO DE INICIO ==========
# Comando para ejecutar la aplicación compilada
# "node": Ejecutor de JavaScript de Node.js
# "dist/main": Archivo principal compilado (main.js en el directorio dist)
# Este es más eficiente que usar yarn start porque ejecuta directamente el código compilado
CMD [ "node","dist/main" ]