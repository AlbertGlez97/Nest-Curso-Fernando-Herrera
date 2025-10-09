# Módulos en NestJS

## ¿Qué es un Módulo?

Un **módulo** es una clase decorada con `@Module()` que organiza el código de la aplicación en bloques funcionales. Los módulos ayudan a:
- Organizar el código por características (feature modules)
- Encapsular funcionalidad relacionada
- Gestionar dependencias entre diferentes partes de la aplicación
- Facilitar la reutilización de código

## Estructura de un Módulo

```typescript
@Module({
  imports: [],      // Módulos que este módulo necesita
  controllers: [],  // Controladores de este módulo
  providers: [],    // Servicios/proveedores de este módulo
  exports: [],      // Servicios que otros módulos pueden usar
})
export class MiModulo {}
```

## Componentes de un Módulo

### imports
Módulos externos que este módulo necesita.

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage]),
    ConfigModule,
    ProductsModule,  // Importar otro módulo custom
  ],
})
```

### controllers
Controladores que manejan las peticiones HTTP.

```typescript
@Module({
  controllers: [ProductsController],
})
```

### providers
Servicios, repositorios, helpers, guards, etc. que pertenecen al módulo.

```typescript
@Module({
  providers: [
    ProductsService,
    ProductImageUrlHelper,
  ],
})
```

### exports
Servicios y módulos que otros módulos pueden usar.

```typescript
@Module({
  providers: [ProductsService],
  exports: [
    ProductsService,      // Exportar servicio
    TypeOrmModule,        // Exportar módulo importado
  ],
})
```

## Tipos de Módulos

### 1. Root Module (AppModule)

El módulo principal que arranca la aplicación.

```typescript
@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT!,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    ProductsModule,
    CommonModule,
    SeedModule,
    FilesModule,
  ],
})
export class AppModule {}
```

### 2. Feature Modules

Módulos que agrupan funcionalidad por característica.

#### ProductsModule

```typescript
@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ProductImageUrlHelper],
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage]),
    ConfigModule,
  ],
  exports: [ProductsService, TypeOrmModule],
})
export class ProductsModule {}
```

**Características:**
- Agrupa todo lo relacionado con productos
- Exporta ProductsService para uso en otros módulos
- Importa TypeOrmModule para acceso a BD

#### SeedModule

```typescript
@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports: [ProductsModule],  // Usa ProductsService exportado
})
export class SeedModule {}
```

**Características:**
- Importa ProductsModule completo
- Puede inyectar ProductsService en SeedService
- No exporta nada (módulo de utilidad)

#### FilesModule

```typescript
@Module({
  controllers: [FilesController],
  providers: [FilesService],
  imports: [ConfigModule],
})
export class FilesModule {}
```

### 3. Shared Modules (Módulos Compartidos)

Módulos con funcionalidad común reutilizable.

#### CommonModule

```typescript
@Module({
  // DTOs compartidos, pipes, guards, decorators
})
export class CommonModule {}
```

### 4. Global Modules

Módulos disponibles en toda la aplicación sin necesidad de importarlos.

```typescript
@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
```

**Uso**: Una vez importado en AppModule, está disponible en todos los módulos.

## Compartir Servicios Entre Módulos

### Paso 1: Exportar el Servicio

En el módulo que provee el servicio:

```typescript
// products.module.ts
@Module({
  providers: [ProductsService],
  exports: [ProductsService],  // ✅ Exportar
})
export class ProductsModule {}
```

### Paso 2: Importar el Módulo

En el módulo que necesita el servicio:

```typescript
// seed.module.ts
@Module({
  imports: [ProductsModule],  // ✅ Importar el módulo completo
  providers: [SeedService],
})
export class SeedModule {}
```

### Paso 3: Inyectar el Servicio

En el servicio que lo necesita:

```typescript
// seed.service.ts
@Injectable()
export class SeedService {
  constructor(
    private readonly productsService: ProductsService,  // ✅ Inyectar
  ) {}

  async runSeed() {
    await this.productsService.deleteAllProducts();
  }
}
```

## Flujo Completo de Dependencias

```
ProductsModule
  ├── providers: [ProductsService]
  └── exports: [ProductsService]
        ↓
SeedModule
  ├── imports: [ProductsModule]
  └── providers: [SeedService]
        ↓
SeedService
  └── constructor(ProductsService)  // ✅ Funciona
```

## TypeOrmModule.forFeature()

Registra entidades para que puedan ser inyectadas como repositorios.

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage]),
  ],
  providers: [ProductsService],
})
export class ProductsModule {}
```

En el servicio:

```typescript
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}
}
```

## ConfigModule - Variables de Entorno

### Configuración Global

```typescript
// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot(),  // Lee .env globalmente
  ],
})
```

### Uso en Módulos

```typescript
// products.module.ts
@Module({
  imports: [ConfigModule],  // Para usar ConfigService
  providers: [ProductsService],
})
```

### Inyectar ConfigService

```typescript
@Injectable()
export class ProductsService {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  getApiUrl() {
    return this.configService.get('HOST_API');
  }
}
```

## Errores Comunes

### ❌ Error: "Cannot resolve dependencies"

**Causa**: Intentar inyectar un servicio sin importar su módulo.

```typescript
// ❌ INCORRECTO
@Module({
  imports: [],  // Falta ProductsModule
  providers: [SeedService],  // Usa ProductsService
})
```

**Solución**: Importar el módulo que exporta el servicio.

```typescript
// ✅ CORRECTO
@Module({
  imports: [ProductsModule],  // Importar módulo
  providers: [SeedService],
})
```

### ❌ Error: "Provider not exported"

**Causa**: Intentar usar un servicio que no está exportado.

```typescript
// products.module.ts - ❌ INCORRECTO
@Module({
  providers: [ProductsService],
  // exports: [],  // No exporta ProductsService
})
```

**Solución**: Exportar el servicio.

```typescript
// ✅ CORRECTO
@Module({
  providers: [ProductsService],
  exports: [ProductsService],  // Exportar
})
```

### ❌ Importar Servicio en lugar de Módulo

```typescript
// ❌ INCORRECTO
@Module({
  imports: [ProductsService],  // Los servicios NO van en imports
})
```

```typescript
// ✅ CORRECTO
@Module({
  imports: [ProductsModule],  // Los MÓDULOS van en imports
})
```

## Reglas de Oro

1. **imports** = Módulos que necesito
2. **providers** = Servicios que creo
3. **exports** = Servicios que comparto
4. **controllers** = Endpoints HTTP

Para compartir:
- ✅ Exporta el servicio en el módulo que lo crea
- ✅ Importa el módulo completo donde lo necesites
- ✅ Inyecta el servicio en el constructor

## Generar Módulos con CLI

```bash
# Crear módulo completo (module, controller, service)
nest g resource products

# Solo módulo
nest g module products

# Solo servicio
nest g service products

# Solo controlador
nest g controller products
```
