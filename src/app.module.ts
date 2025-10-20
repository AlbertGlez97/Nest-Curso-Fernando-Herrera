// =========================================================================
// IMPORTS DE NESTJS Y LIBRERÍAS EXTERNAS
// =========================================================================
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// =========================================================================
// IMPORTS DE MÓDULOS DE LA APLICACIÓN
// =========================================================================
import { ProductsModule } from './products/products.module';
import { CommonModule } from './common/common.module';
import { SeedModule } from './seed/seed.module';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import { MessagesWsModule } from './messages-ws/messages-ws.module';

// =========================================================================
// MÓDULO RAÍZ DE LA APLICACIÓN - AppModule
// =========================================================================
// Este es el módulo principal de la aplicación NestJS.
// Todos los demás módulos se registran aquí para configurar la aplicación completa.
//
// RESPONSABILIDADES:
// 1. Configurar variables de entorno (.env)
// 2. Configurar conexión a la base de datos PostgreSQL con TypeORM
// 3. Configurar servidor de archivos estáticos
// 4. Importar y registrar todos los módulos funcionales de la aplicación
@Module({
  imports: [
    // =====================================================================
    // ConfigModule - GESTIÓN DE VARIABLES DE ENTORNO
    // =====================================================================
    // ConfigModule.forRoot() carga automáticamente el archivo .env
    // y hace que las variables de entorno estén disponibles en toda la aplicación
    // mediante el servicio ConfigService
    //
    // CONFIGURACIÓN:
    // - forRoot() sin opciones busca el archivo .env en la raíz del proyecto
    // - Las variables quedan disponibles mediante process.env.VARIABLE_NAME
    // - También se pueden inyectar usando ConfigService para mejor tipado
    //
    // VARIABLES CARGADAS (definidas en .env):
    // - DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME (PostgreSQL)
    // - HOST_API (URL base de la API para construir URLs públicas)
    // - PORT (puerto donde corre la aplicación)
    ConfigModule.forRoot(),

    // =====================================================================
    // TypeOrmModule - CONFIGURACIÓN DE LA BASE DE DATOS
    // =====================================================================
    // TypeORM es un ORM (Object-Relational Mapping) que permite interactuar
    // con la base de datos usando clases TypeScript en lugar de SQL directo
    //
    // forRoot() configura la conexión principal a la base de datos
    // Esta configuración es global y se comparte en toda la aplicación
    TypeOrmModule.forRoot({
      // TIPO DE BASE DE DATOS:
      // Indica que usamos PostgreSQL como motor de base de datos
      // TypeORM soporta: mysql, mariadb, postgres, sqlite, mssql, oracle, etc.
      type: 'postgres',

      // CONFIGURACIÓN DE CONEXIÓN:
      // Estas variables provienen del archivo .env cargado por ConfigModule

      // HOST: Dirección del servidor de base de datos (ej: 'localhost', '127.0.0.1')
      host: process.env.DB_HOST,

      // PORT: Puerto de PostgreSQL (por defecto 5432)
      // El operador + convierte el string a número
      // El operador ! le dice a TypeScript que confiamos que la variable existe
      port: +process.env.DB_PORT!,

      // USERNAME: Usuario de PostgreSQL para autenticación
      username: process.env.DB_USERNAME,

      // PASSWORD: Contraseña del usuario de PostgreSQL
      password: process.env.DB_PASSWORD,

      // DATABASE: Nombre de la base de datos específica a usar
      database: process.env.DB_NAME,

      // AUTOLOADENTITIES:
      // Cuando es true, TypeORM carga automáticamente todas las entidades
      // registradas en los módulos con TypeOrmModule.forFeature([Entity])
      //
      // VENTAJA: No necesitamos listar manualmente todas las entidades aquí
      // En lugar de:
      //   entities: [Product, ProductImage, User, Order, ...]
      // Simplemente usamos:
      //   autoLoadEntities: true
      //
      // TypeORM encuentra automáticamente las entidades cuando hacemos:
      //   TypeOrmModule.forFeature([Product, ProductImage]) en ProductsModule
      autoLoadEntities: true,

      // SYNCHRONIZE:
      // ⚠️ IMPORTANTE: Esta opción es MUY PELIGROSA en producción
      //
      // Cuando es true:
      // - TypeORM sincroniza automáticamente el esquema de la base de datos
      //   con las definiciones de las entidades en cada inicio de la aplicación
      // - Crea/modifica/elimina tablas y columnas automáticamente
      // - Útil para desarrollo rápido sin escribir SQL manual
      //
      // EJEMPLO DE FUNCIONAMIENTO:
      // Si cambias en tu entity:
      //   @Column() name: string;  →  @Column() fullName: string;
      // TypeORM automáticamente renombra la columna en la BD
      //
      // ❌ NUNCA usar en producción porque:
      // - Puede eliminar datos si cambias una columna
      // - No tienes control sobre las migraciones
      // - No hay historial de cambios
      // - Puede causar pérdida de datos accidental
      //
      // ✅ SOLUCIÓN PARA PRODUCCIÓN:
      // - synchronize: false
      // - Usar migraciones de TypeORM (archivos versionados con cambios SQL)
      // - Ejemplo: yarn typeorm migration:generate ./migrations/AddUserTable
      synchronize: true,
    }),

    // =====================================================================
    // ServeStaticModule - SERVIDOR DE ARCHIVOS ESTÁTICOS
    // =====================================================================
    // Este módulo permite servir archivos estáticos directamente desde
    // una carpeta del servidor, similar a como lo haría nginx o Apache
    //
    // USE CASE: Servir imágenes de productos, assets, documentos, etc.
    ServeStaticModule.forRoot({
      // ROOTPATH: Ruta absoluta de la carpeta que contiene archivos estáticos
      //
      // join(__dirname, '..', 'public') construye la ruta:
      // - __dirname: Directorio actual donde está este archivo compilado
      //   En desarrollo: .../dist/src/
      // - '..': Sube un nivel → .../dist/
      // - 'public': Carpeta public → .../dist/public/
      //
      // ESTRUCTURA DE ARCHIVOS:
      // proyecto/
      // ├── dist/
      // │   ├── public/              ← Archivos servidos públicamente
      // │   │   └── products/
      // │   │       └── imagen1.jpg
      // │   └── src/
      // │       └── app.module.js    ← __dirname apunta aquí
      // ├── src/
      // └── static/                  ← Archivos originales (copiados a dist/public)
      //
      // ACCESO:
      // Si tienes: dist/public/products/imagen1.jpg
      // Lo accedes en: http://localhost:3000/products/imagen1.jpg
      //
      // NOTA: Los archivos en 'public' son accesibles sin autenticación
      rootPath: join(__dirname, '..', 'public'),
    }),

    // =====================================================================
    // MÓDULOS FUNCIONALES DE LA APLICACIÓN
    // =====================================================================
    // Estos son los módulos que encapsulan la lógica de negocio

    // PRODUCTSMODULE: Gestión completa de productos
    // - CRUD de productos (crear, leer, actualizar, eliminar)
    // - Manejo de imágenes de productos
    // - Validaciones de negocio (stock, precios, etc.)
    // - Relaciones con ProductImage
    ProductsModule,

    // COMMONMODULE: Utilidades compartidas entre módulos
    // - DTOs reutilizables (PaginationDto)
    // - Pipes personalizados
    // - Guards y decorators comunes
    // - Funciones helper compartidas
    CommonModule,

    // SEEDMODULE: Población de datos iniciales
    // - Endpoint para llenar la BD con datos de prueba
    // - Útil para desarrollo y testing
    // - Usa ProductsService para crear productos
    SeedModule,

    // FILESMODULE: Gestión de archivos subidos
    // - Upload de imágenes de productos
    // - Validación de tipos de archivo (solo imágenes)
    // - Generación de nombres únicos (UUID)
    // - Endpoint para servir archivos: /api/files/product/:imageName
    FilesModule,

    // AUTHMODULE: Sistema de autenticación y autorización
    // - Registro de usuarios con validación de contraseñas
    // - Hasheo de contraseñas con bcrypt (salt rounds: 10)
    // - Sistema de roles (user, admin, super-admin)
    // - Soft delete de usuarios (isActive flag)
    // - Endpoint de registro: POST /api/auth/register
    // Pendiente:
    // - Login con JWT
    // - Guards para proteger rutas
    // - Decoradores personalizados (@GetUser, @Roles)
    AuthModule,

    MessagesWsModule,
  ],
})
export class AppModule {}
