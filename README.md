<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Teslo API

1. Clonar el repositorio
2. Ejecutar ```yarn install```
3. Clonar el archivo .env.example y renombrarlo a .env
4. Levantar la base de datos con docker-compose
```docker-compose up -d ```
5. Ejecutar la aplicación en modo desarrollo
```yarn start:dev```

## Base de Datos

### TypeORM y ORM

**¿Qué es un ORM?**
Un ORM (Object-Relational Mapping) es una herramienta que actúa como puente entre el código orientado a objetos y las bases de datos relacionales. En lugar de escribir SQL directamente, puedes trabajar con objetos y métodos de JavaScript/TypeScript.

**Ejemplo práctico:**
- Sin ORM: `SELECT * FROM users WHERE id = 1`
- Con ORM: `User.findOne({ where: { id: 1 } })`

**TypeORM** es el ORM más popular para TypeScript/JavaScript que permite:
- Crear modelos (entidades) que representan tablas
- Realizar operaciones CRUD sin escribir SQL
- Mantener relaciones entre tablas de forma sencilla
- Generar migraciones automáticamente

### Instalación
```bash
yarn add @nestjs/typeorm typeorm pg
```

- `@nestjs/typeorm`: Integración de TypeORM con NestJS
- `typeorm`: El ORM principal  
- `pg`: Driver para PostgreSQL

### Configuración en app.module.ts
Se configuró TypeORM para conectarse a PostgreSQL. Explicación línea por línea:

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',              // Tipo de base de datos (postgres, mysql, sqlite, etc.)
  host: process.env.DB_HOST,     // Dirección del servidor (ej: localhost)
  port: +process.env.DB_PORT!,   // Puerto de conexión (ej: 5432 para PostgreSQL)
  username: process.env.DB_USER, // Usuario de la base de datos
  password: process.env.DB_PASSWORD, // Contraseña del usuario
  database: process.env.DB_NAME, // Nombre de la base de datos específica
  autoLoadEntities: true,        // Busca y carga automáticamente todas las entidades
  synchronize: true,             // Sincroniza automáticamente el esquema (solo desarrollo)
})
```

**Detalles importantes:**
- `+process.env.DB_PORT!`: El `+` convierte el string a número, `!` indica que sabemos que existe
- `autoLoadEntities`: Evita tener que registrar manualmente cada entidad en el módulo
- `synchronize: true`: **PELIGROSO en producción** - puede borrar datos. Usar migraciones en producción

