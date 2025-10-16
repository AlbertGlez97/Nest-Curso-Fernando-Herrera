# Swagger - Documentación de API

## 📚 Índice

1. [Introducción](#introducción)
2. [Instalación y Configuración](#instalación-y-configuración)
3. [Decoradores de Documentación](#decoradores-de-documentación)
4. [PartialType y DTOs](#partialtype-y-dtos)
5. [Mejores Prácticas](#mejores-prácticas)
6. [Autenticación JWT](#autenticación-jwt)
7. [Herramientas Adicionales](#herramientas-adicionales)

---

## Introducción

### ¿Qué es Swagger/OpenAPI?

**Swagger** (ahora **OpenAPI**) es una especificación para documentar APIs REST:

- **Documentación automática**: Genera docs interactivas desde el código
- **Testing integrado**: Prueba endpoints directamente desde el navegador
- **Validación de contratos**: Verifica que la API cumple con su especificación
- **Generación de clientes**: Crea código cliente para múltiples lenguajes

### Alternativas de visualización

- **Swagger UI**: Interfaz interactiva para testing (incluida por defecto)
- **Redoc**: Documentación más limpia y profesional (mejor para compartir)

---

## Instalación y Configuración

### 1. Instalar dependencias

```bash
yarn add @nestjs/swagger swagger-ui-express
```

**Opcional: Redoc**
```bash
yarn add redoc-express
```

### 2. Configurar en `main.ts`

```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import redocSetup from 'redoc-express'; // Opcional

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Teslo Shop API')
    .setDescription('Teslo shop endpoints')
    .setVersion('1.0')
    .addBearerAuth() // Para JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger UI
  SwaggerModule.setup('api/docs', app, document);

  // Redoc (opcional)
  app.use('/api/redoc', redocSetup({
    title: 'Teslo Shop API - Redoc',
    specUrl: '/api/docs-json',
  }));

  await app.listen(3000);
  logger.log(`Swagger UI: ${await app.getUrl()}/api/docs`);
  logger.log(`Redoc: ${await app.getUrl()}/api/redoc`);
}
```

### 3. Acceder a la documentación

- **Swagger UI**: `http://localhost:3000/api/docs`
- **Redoc**: `http://localhost:3000/api/redoc`

---

## Decoradores de Documentación

### @ApiTags()

**Propósito**: Agrupa endpoints por categorías en la UI

```typescript
@ApiTags('Products')
@Controller('products')
export class ProductsController {}
```

---

### @ApiProperty()

**Propósito**: Documenta propiedades de DTOs y Entidades

**Ubicación**:
- **DTOs**: Documenta estructura de entrada (request)
- **Entidades**: Documenta estructura de salida (response)

#### En DTOs (Input)

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Camiseta Nike',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({
    description: 'Precio en dólares',
    example: 29.99,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsPositive()
  price?: number;

  @ApiProperty({
    description: 'Tallas disponibles',
    example: ['S', 'M', 'L'],
    isArray: true,
  })
  @IsArray()
  sizes: string[];
}
```

#### En Entidades (Output)

```typescript
@Entity({ name: 'products' })
export class Product {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Product UUID',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'T-Shirt Teslo',
    description: 'Product title',
  })
  @Column('text')
  title: string;

  // Relación
  @ApiProperty({
    type: () => User,
    description: 'User who created the product',
  })
  @ManyToOne(() => User, (user) => user.product)
  user: User;
}
```

#### Propiedades disponibles

| Propiedad | Descripción | Ejemplo |
|-----------|-------------|---------|
| `description` | Descripción del campo | `'Nombre del producto'` |
| `example` | Valor de ejemplo | `'Nike Shirt'` |
| `required` | Si es obligatorio | `false` |
| `minimum/maximum` | Límites numéricos | `minimum: 0` |
| `minLength/maxLength` | Longitud de strings | `minLength: 1` |
| `enum` | Valores permitidos | `['men', 'women']` |
| `isArray` | Indica si es array | `true` |
| `type` | Tipo (para relaciones) | `() => User` |
| `default` | Valor por defecto | `10` |
| `uniqueItems` | Valores únicos | `true` |
| `writeOnly` | Solo escritura | `true` (passwords) |

---

### @ApiResponse()

**Propósito**: Documenta respuestas de endpoints

#### ✅ Forma recomendada (con `type`)

```typescript
@Get(':id')
@ApiResponse({
  status: 200,
  description: 'Producto encontrado',
  type: Product, // Usa la entidad
})
@ApiResponse({
  status: 404,
  description: 'Producto no encontrado',
})
findOne(@Param('id') id: string) {
  return this.productsService.findOne(id);
}
```

#### Para arrays

```typescript
@Get()
@ApiResponse({
  status: 200,
  description: 'Lista de productos',
  type: [Product], // Array de productos
})
findAll() {
  return this.productsService.findAll();
}
```

---

### @ApiBody()

**Propósito**: Ejemplos múltiples para testing

```typescript
@Post()
@ApiBody({
  type: CreateProductDto,
  examples: {
    completo: {
      summary: 'Producto completo',
      value: {
        title: 'Nike Shirt',
        price: 29.99,
        sizes: ['S', 'M', 'L'],
        gender: 'unisex'
      }
    },
    minimo: {
      summary: 'Solo requeridos',
      value: {
        title: 'Adidas Shoes',
        sizes: ['38', '39'],
        gender: 'men'
      }
    }
  }
})
create(@Body() dto: CreateProductDto) {}
```

---

### @ApiParam()

**Propósito**: Documenta parámetros de ruta

```typescript
@Get(':id')
@ApiParam({
  name: 'id',
  description: 'UUID del producto',
  example: '550e8400-e29b-41d4-a716-446655440000'
})
findOne(@Param('id') id: string) {}
```

---

### @ApiQuery()

**Propósito**: Documenta parámetros de query

```typescript
@Get()
@ApiQuery({
  name: 'limit',
  required: false,
  description: 'Número de resultados',
  example: 10
})
@ApiQuery({
  name: 'offset',
  required: false,
  description: 'Resultados a saltar',
  example: 0
})
findAll(@Query() dto: PaginationDto) {}
```

---

## PartialType y DTOs

### El problema con `@nestjs/mapped-types`

```typescript
import { PartialType } from '@nestjs/mapped-types';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

❌ **Problema**: Swagger NO hereda los `@ApiProperty()` del DTO base

### La solución: `@nestjs/swagger`

```typescript
import { PartialType } from '@nestjs/swagger';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

✅ **Resultado**: Hereda propiedades, validaciones Y documentación

### Comparación

| Aspecto | @nestjs/mapped-types | @nestjs/swagger |
|---------|---------------------|-----------------|
| Hereda propiedades | ✅ | ✅ |
| Hereda validaciones | ✅ | ✅ |
| Hereda `@ApiProperty()` | ❌ | ✅ |
| Documenta en Swagger | ❌ | ✅ |
| **Usar cuando** | Sin Swagger | Con Swagger ⭐ |

### Otros helpers disponibles

```typescript
import {
  PartialType,      // Todos opcionales
  PickType,         // Selecciona campos
  OmitType,         // Excluye campos
  IntersectionType  // Combina DTOs
} from '@nestjs/swagger';

// Ejemplos
class LoginDto extends PickType(CreateUserDto, ['email', 'password']) {}
class UpdateUserDto extends OmitType(CreateUserDto, ['password']) {}
```

---

## Mejores Prácticas

### 1. Usar `type` en lugar de `example`

#### ❌ Evitar

```typescript
@ApiResponse({
  status: 200,
  example: { // Manual, difícil de mantener
    id: '550e8400...',
    title: 'Product',
    price: 29.99
  }
})
```

#### ✅ Recomendado

```typescript
@ApiResponse({
  status: 200,
  type: Product, // Automático
})
```

**Ventajas**:
- Sincronizado con `@ApiProperty()` de la entidad
- Se actualiza automáticamente
- Una sola fuente de verdad

### 2. Documentar DTOs Y Entidades

- **DTOs**: Documenta la entrada con `@ApiProperty()`
- **Entidades**: Documenta la salida con `@ApiProperty()`

### 3. Evitar redundancia

❌ **Malo**: `description: 'Número de resultados (por defecto: 10)'`
✅ **Bueno**: `description: 'Número de resultados'` + `default: 10`

Swagger muestra el default automáticamente.

### 4. Usar `@ApiTags()` para organizar

Agrupa endpoints lógicamente:

```typescript
@ApiTags('Products')
@Controller('products')
export class ProductsController {}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {}
```

---

## Autenticación JWT

### 1. Configurar Bearer Auth

```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('API')
  .addBearerAuth() // ⬅️ Habilita JWT
  .build();
```

### 2. Marcar rutas protegidas

**Opción A**: Individual
```typescript
@Get('profile')
@UseGuards(AuthGuard())
@ApiBearerAuth()
getProfile() {}
```

**Opción B**: Decorador compuesto (recomendado)
```typescript
// auth.decorator.ts
export function Auth(...roles: ValidRoles[]) {
  return applyDecorators(
    RoleProtected(...roles),
    UseGuards(AuthGuard(), UserRoleGuard),
    ApiBearerAuth(), // ⬅️ Incluido
  );
}

// Uso
@Get('profile')
@Auth(ValidRoles.USER)
getProfile() {}
```

### 3. Usar en Swagger UI

1. Login → Copiar token de la respuesta
2. Click botón **"Authorize"** 🔒
3. Pegar token (sin "Bearer")
4. Click **"Authorize"** → **"Close"**
5. Probar rutas protegidas

---

## Herramientas Adicionales

### Ocultar endpoints

```typescript
@ApiExcludeEndpoint()
@Get('internal')
internalRoute() {} // No aparece en Swagger
```

### Exportar definición OpenAPI

```typescript
const document = SwaggerModule.createDocument(app, config);

// Guardar JSON
import { writeFileSync } from 'fs';
writeFileSync('./openapi.json', JSON.stringify(document));
```

Úsalo para:
- Generar clientes en otros lenguajes
- Compartir con equipos frontend
- Validar contratos de API

### Comparación Swagger UI vs Redoc

| Característica | Swagger UI | Redoc |
|---------------|------------|-------|
| **Testing** | ✅ Interactivo | ❌ Solo lectura |
| **Diseño** | Funcional | ✅ Más elegante |
| **Velocidad** | Lento en APIs grandes | ✅ Más rápido |
| **Navegación** | Básica | ✅ Búsqueda avanzada |
| **Uso** | Testing y desarrollo | Documentación pública |

**Recomendación**: Usa ambos
- Swagger UI para desarrollo
- Redoc para compartir con clientes

---

## Resumen de Decoradores

| Decorador | Ubicación | Propósito |
|-----------|-----------|-----------|
| `@ApiTags()` | Controlador | Agrupar endpoints |
| `@ApiProperty()` | DTO/Entidad | Documentar propiedades |
| `@ApiResponse()` | Endpoint | Documentar respuestas |
| `@ApiBody()` | Endpoint | Ejemplos de entrada |
| `@ApiParam()` | Endpoint | Parámetros de ruta |
| `@ApiQuery()` | Endpoint | Parámetros de query |
| `@ApiBearerAuth()` | Endpoint | Marcar como protegido |
| `@ApiExcludeEndpoint()` | Endpoint | Ocultar de docs |
