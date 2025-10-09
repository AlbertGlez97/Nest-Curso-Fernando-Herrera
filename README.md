<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Teslo API

API REST para e-commerce desarrollada con NestJS, TypeORM y PostgreSQL.

## 📚 Documentación del Proyecto

La documentación completa del proyecto está organizada en las siguientes secciones:

### 🚀 Inicio Rápido
- **[Setup Inicial](./notas/01-setup-inicial.md)** - Instalación, configuración y primeros pasos

### 📖 Conceptos Fundamentales
- **[Base de Datos y TypeORM](./notas/02-base-de-datos.md)** - Entidades, relaciones, repositorios y operaciones CRUD
- **[Swagger - Documentación de API](./notas/03-swagger-documentacion.md)** - Configuración y decoradores para documentar la API
- **[Validación y DTOs](./notas/04-validacion-dtos.md)** - class-validator, transformaciones y validaciones personalizadas
- **[Módulos en NestJS](./notas/05-modulos-nest.md)** - Estructura, dependencias y comunicación entre módulos

### 🔧 Temas Avanzados
- **[Manejo de Archivos con Multer](./notas/06-manejo-archivos.md)** - Subida de imágenes, validación y almacenamiento
- **[Patterns de Helpers](./notas/07-helpers-patterns.md)** - Funciones simples vs clases inyectables

---

## ⚡ Inicio Rápido

```bash
# 1. Instalar dependencias
yarn install

# 2. Configurar variables de entorno
cp .env.template .env

# 3. Levantar base de datos
docker-compose up -d

# 4. Ejecutar la aplicación
yarn start:dev

# 5. Cargar datos de prueba
# Visitar: http://localhost:3000/api/seed
```

## 🔗 URLs Importantes

- **API Base**: `http://localhost:3000/api`
- **Swagger Docs**: `http://localhost:3000/api/docs`
- **Seed Endpoint**: `http://localhost:3000/api/seed`

## 📦 Scripts Disponibles

### Desarrollo
```bash
yarn start:dev      # Modo desarrollo con hot reload
yarn start:debug    # Modo debug
yarn start:prod     # Modo producción
yarn build          # Compilar proyecto
```

### Testing
```bash
yarn test           # Ejecutar tests
yarn test:watch     # Tests en modo watch
yarn test:cov       # Tests con cobertura
yarn test:e2e       # Tests end-to-end
```

### Calidad de Código
```bash
yarn lint           # ESLint con auto-fix
yarn format         # Prettier
```

## 🏗️ Estructura del Proyecto

```
teslo-app/
├── src/
│   ├── common/          # DTOs y utilidades compartidas
│   ├── files/           # Módulo de manejo de archivos
│   ├── products/        # Módulo de productos
│   ├── seed/            # Módulo de seed data
│   ├── app.module.ts    # Módulo raíz
│   └── main.ts          # Punto de entrada
├── static/              # Archivos estáticos (imágenes)
├── public/              # Archivos públicos
├── notas/               # 📚 Documentación detallada
├── .env                 # Variables de entorno
├── docker-compose.yml   # Configuración de PostgreSQL
└── package.json
```

## 🛠️ Stack Tecnológico

- **Framework**: NestJS 11
- **Lenguaje**: TypeScript 5
- **Base de Datos**: PostgreSQL 14
- **ORM**: TypeORM 0.3
- **Validación**: class-validator, class-transformer
- **Documentación**: Swagger (OpenAPI)
- **Archivos**: Multer
- **Testing**: Jest

## 📝 Variables de Entorno

Crear archivo `.env` basado en `.env.template`:

```env
DB_PASSWORD=MySecr3tPassWord@as2
DB_NAME=TesloDB
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
PORT=50278
HOST_API=http://localhost:3000/api
```

## 🎯 Características Principales

- ✅ API REST completa con CRUD de productos
- ✅ Relaciones entre entidades (Product ↔ ProductImage)
- ✅ Validación automática con DTOs
- ✅ Documentación interactiva con Swagger
- ✅ Subida y gestión de imágenes
- ✅ Paginación de resultados
- ✅ Seed data para desarrollo
- ✅ Generación automática de slugs
- ✅ UUIDs como identificadores

## 🐳 Docker

El proyecto incluye `docker-compose.yml` para levantar PostgreSQL:

```bash
docker-compose up -d        # Iniciar
docker-compose down         # Detener
docker-compose logs db      # Ver logs
```

## 📚 Aprende Más

Para entender a profundidad cada concepto del proyecto, consulta la documentación en la carpeta [`notas/`](./notas):

1. [Setup Inicial](./notas/01-setup-inicial.md)
2. [Base de Datos y TypeORM](./notas/02-base-de-datos.md)
3. [Swagger - Documentación](./notas/03-swagger-documentacion.md)
4. [Validación y DTOs](./notas/04-validacion-dtos.md)
5. [Módulos en NestJS](./notas/05-modulos-nest.md)
6. [Manejo de Archivos](./notas/06-manejo-archivos.md)
7. [Patterns de Helpers](./notas/07-helpers-patterns.md)

---

## 👨‍💻 Desarrollo

Este proyecto fue desarrollado como parte del curso de NestJS de Fernando Herrera.

## 📄 Licencia

UNLICENSED
