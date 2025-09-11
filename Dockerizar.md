# ===================================================================
# DOCKERIZACIÓN DE LA APLICACIÓN NEST.JS POKÉDEX
# ===================================================================
# 
# ¿QUÉ ES DOCKERIZAR?
# Dockerizar significa empaquetar una aplicación junto con todas sus dependencias
# (runtime, librerías, variables de entorno, archivos de configuración) en un 
# contenedor ligero y portable que puede ejecutarse consistentemente en cualquier
# entorno que tenga Docker instalado.
#
# BENEFICIOS DE DOCKERIZAR:
# 1. PORTABILIDAD: Funciona igual en desarrollo, testing y producción
# 2. AISLAMIENTO: La aplicación corre en su propio entorno aislado
# 3. CONSISTENCIA: Elimina el problema "funciona en mi máquina"
# 4. ESCALABILIDAD: Fácil de replicar y escalar horizontalmente
# 5. VERSIONADO: Cada imagen es inmutable y versionada
# ===================================================================

# IMAGEN BASE: Node.js 18 sobre Alpine Linux (distribución minimalista)
# Alpine Linux es muy pequeña (~5MB) lo que hace la imagen final más ligera
# Node 18 es la versión LTS recomendada para aplicaciones en producción
FROM node:18-alpine3.15

# CONFIGURACIÓN DEL DIRECTORIO DE TRABAJO
# Crear el directorio donde vivirá nuestra aplicación dentro del contenedor
RUN mkdir -p /var/www/pokedex

# Establecer el directorio de trabajo principal para todos los comandos siguientes
# Equivale a hacer "cd /var/www/pokedex" en cada instrucción posterior
WORKDIR /var/www/pokedex

# COPIA DE ARCHIVOS AL CONTENEDOR
# Copiar todo el código fuente desde el directorio local al contenedor
# El "." representa el directorio actual donde está el Dockerfile
COPY . ./var/www/pokedex

# Copiar archivos específicos de configuración al directorio de trabajo
# package.json: Contiene las dependencias y scripts de npm/yarn
# tsconfig.json: Configuración del compilador de TypeScript
# tsconfig.build.json: Configuración específica para el build de producción
COPY package.json tsconfig.json tsconfig.build.json /var/www/pokedex/

# INSTALACIÓN DE DEPENDENCIAS DE PRODUCCIÓN
# --prod instala solo las dependencias necesarias para producción (no devDependencies)
# Esto reduce el tamaño de la imagen y mejora la seguridad
RUN yarn install --prod

# COMPILACIÓN DE LA APLICACIÓN TYPESCRIPT
# Convierte el código TypeScript a JavaScript optimizado para producción
# Genera el directorio /dist con el código compilado
RUN yarn build

# CONFIGURACIÓN DE SEGURIDAD Y PERMISOS
# Crear un usuario sin privilegios para ejecutar la aplicación
# --disabled-password: El usuario no puede hacer login con contraseña
# Esto es una buena práctica de seguridad (principio de menor privilegio)
RUN adduser --disabled-password pokeuser

# Cambiar el propietario de todos los archivos al nuevo usuario
# -R: Recursivo para todos los archivos y subdirectorios
# pokeuser:pokeuser: usuario:grupo propietario
RUN chown -R pokeuser:pokeuser /var/www/pokedex

# Cambiar al usuario sin privilegios para ejecutar la aplicación
# A partir de este punto, todos los comandos se ejecutan como 'pokeuser'
USER pokeuser

# OPTIMIZACIÓN: LIMPIEZA DEL CACHÉ DE YARN
# Eliminar archivos temporales de yarn para reducir el tamaño de la imagen
# --force: Forzar la limpieza sin confirmación
RUN yarn cache clean --force

# EXPOSICIÓN DEL PUERTO
# Documenta que la aplicación escucha en el puerto 3000
# NOTA: Esto NO publica el puerto, solo es documentación
# Para acceder desde el host se necesita mapear el puerto al ejecutar el contenedor
EXPOSE 3000

# COMANDO DE INICIO DE LA APLICACIÓN
# Define el comando que se ejecutará cuando se inicie el contenedor
# ["yarn", "start"]: Ejecuta el script "start" definido en package.json
# Este comando mantiene el contenedor corriendo y la aplicación activa
CMD [ "yarn","start" ]