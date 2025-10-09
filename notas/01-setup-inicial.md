# Setup Inicial del Proyecto

## Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd teslo-app
```

### 2. Instalar Dependencias
```bash
yarn install
```

### 3. Configurar Variables de Entorno
```bash
cp .env.template .env
```

Editar el archivo `.env` con tus credenciales:
```env
DB_PASSWORD=MySecr3tPassWord@as2
DB_NAME=TesloDB
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
PORT=50278
HOST_API=http://localhost:3000/api
```

### 4. Levantar la Base de Datos
```bash
docker-compose up -d
```

Esto levantará un contenedor de PostgreSQL 14.3 con la configuración especificada.

### 5. Ejecutar la Aplicación

#### Modo Desarrollo (con hot reload)
```bash
yarn start:dev
```

#### Modo Debug
```bash
yarn start:debug
```

#### Modo Producción
```bash
yarn build
yarn start:prod
```

### 6. Cargar Datos de Prueba (Seed)
Una vez la aplicación esté corriendo, ejecuta:
```bash
# Visita la URL:
http://localhost:3000/api/seed
```

O usa curl/Postman:
```bash
curl http://localhost:3000/api/seed
```

## URLs Importantes

- **API Base**: `http://localhost:3000/api`
- **Swagger Documentation**: `http://localhost:3000/api/docs`
- **Seed Endpoint**: `http://localhost:3000/api/seed`

## Verificar Instalación

Si todo está correcto, deberías ver en la consola:
```
Application is running on: http://localhost:3000/api
Swagger UI is available at: http://localhost:3000/api/docs
```

## Comandos Útiles

### Testing
```bash
yarn test              # Ejecutar tests
yarn test:watch        # Tests en modo watch
yarn test:cov          # Tests con cobertura
yarn test:e2e          # Tests end-to-end
```

### Calidad de Código
```bash
yarn lint              # Ejecutar ESLint con auto-fix
yarn format            # Formatear código con Prettier
```

## Estructura de Carpetas Inicial

```
teslo-app/
├── src/
│   ├── common/          # Módulo común (DTOs compartidos)
│   ├── files/           # Módulo de archivos
│   ├── products/        # Módulo de productos
│   ├── seed/            # Módulo de seed
│   ├── app.module.ts    # Módulo raíz
│   └── main.ts          # Punto de entrada
├── static/              # Archivos estáticos (imágenes)
├── public/              # Archivos públicos
├── .env                 # Variables de entorno (no commitear)
├── .env.template        # Plantilla de variables de entorno
├── docker-compose.yml   # Configuración de Docker
└── package.json         # Dependencias del proyecto
```
