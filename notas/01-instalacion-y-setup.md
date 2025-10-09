# Instalación y Configuración del Proyecto

## Pasos de Instalación

1. Clonar el repositorio
2. Ejecutar `yarn install`
3. Copiar el archivo `.env.template` y renombrarlo a `.env`
4. Levantar la base de datos con docker-compose
   ```bash
   docker-compose up -d
   ```
5. Ejecutar SEED para poblar la base de datos
   ```
   http://localhost:50278/api/seed
   ```
6. Ejecutar la aplicación en modo desarrollo
   ```bash
   yarn start:dev
   ```

## Comandos Disponibles

### Desarrollo
```bash
yarn start:dev                 # Iniciar en modo desarrollo con hot reload
yarn start:debug               # Iniciar en modo debug con hot reload
yarn start                     # Iniciar en modo producción
yarn build                     # Compilar la aplicación
```

### Testing y Calidad
```bash
yarn test                      # Ejecutar tests unitarios
yarn test:watch                # Ejecutar tests en modo watch
yarn test:cov                  # Ejecutar tests con cobertura
yarn test:e2e                  # Ejecutar tests end-to-end
yarn lint                      # Ejecutar ESLint con auto-fix
yarn format                    # Formatear código con Prettier
```

## Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Base de Datos
DB_PASSWORD=MySecr3tPassWord@as2
DB_NAME=TesloDB
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres

# Aplicación
PORT=50278
HOST_API=http://localhost:50278/api
```

## Docker Compose

El archivo `docker-compose.yml` configura PostgreSQL:

```yaml
version: '3'

services:
  db:
    image: postgres:14.3
    restart: always
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    container_name: postgres_teslo
    volumes:
      - ./postgres:/var/lib/postgresql/data
```

## Estructura del Proyecto

```
teslo-app/
├── src/
│   ├── common/           # Módulo común (DTOs compartidos)
│   ├── files/            # Módulo de archivos
│   ├── products/         # Módulo de productos
│   ├── seed/             # Módulo de datos de prueba
│   ├── app.module.ts     # Módulo principal
│   └── main.ts           # Punto de entrada
├── static/               # Archivos estáticos (imágenes)
├── .env                  # Variables de entorno (no commitear)
├── .env.template         # Plantilla de variables de entorno
├── docker-compose.yml    # Configuración de Docker
└── package.json          # Dependencias y scripts
```
