# Swagger - Documentación de API

## ¿Qué es Swagger?

**Swagger** (ahora conocido como OpenAPI) es una herramienta que permite:
- **Documentar APIs automáticamente**: Genera documentación interactiva basada en tu código
- **Probar endpoints**: Interfaz web para hacer peticiones HTTP directamente
- **Validar contratos**: Asegura que la API funciona como está documentada
- **Generar clientes**: Crear código cliente en diferentes lenguajes

## Instalación

```bash
yarn add @nestjs/swagger swagger-ui-express
```

**Dependencias:**
- `@nestjs/swagger`: Integración oficial de Swagger con NestJS
- `swagger-ui-express`: Motor que renderiza la interfaz web

## Configuración Básica

### main.ts

```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Teslo Shop API')
    .setDescription('Teslo shop endpoints')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
  console.log(`Swagger UI: ${await app.getUrl()}/api/docs`);
}
```

### Acceder a Swagger UI

Una vez configurado, visita:
```
http://localhost:3000/api/docs
```

Verás:
- Lista de todos los endpoints organizados por controladores
- Esquemas de los DTOs y entidades
- Interfaz para probar cada endpoint
- Documentación de parámetros, respuestas y códigos de estado

## Decoradores Principales

### @ApiTags()
Organiza endpoints por categorías en la UI.

```typescript
@ApiTags('Products')
@Controller('products')
export class ProductsController {}
```

### @ApiProperty()
Documenta propiedades de DTOs en la sección "Schemas".

```typescript
export class CreateProductDto {
  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Camiseta Nike Básica',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({
    description: 'Precio del producto en dólares',
    example: 29.99,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;

  @ApiProperty({
    description: 'Tallas disponibles',
    example: ['S', 'M', 'L', 'XL'],
    isArray: true,
    type: String,
  })
  @IsString({ each: true })
  @IsArray()
  sizes: string[];

  @ApiProperty({
    description: 'Género al que está dirigido',
    example: 'unisex',
    enum: ['men', 'women', 'kid', 'unisex'],
  })
  @IsIn(['men', 'women', 'kid', 'unisex'])
  gender: string;
}
```

### Propiedades de @ApiProperty

| Propiedad | Descripción | Ejemplo |
|-----------|-------------|---------|
| `description` | Explica qué hace el campo | `'Nombre del producto'` |
| `example` | Valor de ejemplo | `'Camiseta Nike'` |
| `required` | Si es obligatorio | `false` para opcionales |
| `minimum/maximum` | Límites para números | `minimum: 0` |
| `minLength/maxLength` | Longitud para strings | `minLength: 1` |
| `enum` | Valores permitidos | `['men', 'women']` |
| `isArray` | Si es un array | `true` |
| `type` | Tipo de datos | `String`, `Number` |

### @ApiBody()
Proporciona ejemplos completos para testing en endpoints.

```typescript
@Post()
@ApiBody({
  type: CreateProductDto,
  examples: {
    example1: {
      summary: 'Producto completo',
      description: 'Ejemplo con todos los campos',
      value: {
        title: 'Camiseta Nike Básica',
        price: 29.99,
        description: 'Camiseta de algodón 100%',
        slug: 'camiseta-nike-basica',
        stock: 50,
        sizes: ['S', 'M', 'L', 'XL'],
        gender: 'unisex',
        tags: ['nike', 'deportivo'],
        images: ['url://image1.png']
      }
    },
    example2: {
      summary: 'Producto mínimo',
      description: 'Solo campos requeridos',
      value: {
        title: 'Zapatos Adidas',
        sizes: ['38', '39', '40'],
        gender: 'men'
      }
    }
  }
})
create(@Body() createProductDto: CreateProductDto) {
  return this.productsService.create(createProductDto);
}
```

### @ApiResponse()
Documenta las respuestas posibles.

```typescript
@Get(':id')
@ApiResponse({
  status: 200,
  description: 'Producto encontrado',
  type: Product
})
@ApiResponse({
  status: 404,
  description: 'Producto no encontrado'
})
findOne(@Param('id') id: string) {
  return this.productsService.findOne(id);
}
```

### @ApiParam()
Documenta parámetros de ruta.

```typescript
@Get(':id')
@ApiParam({
  name: 'id',
  description: 'UUID del producto',
  example: '550e8400-e29b-41d4-a716-446655440000'
})
findOne(@Param('id') id: string) {
  return this.productsService.findOne(id);
}
```

### @ApiQuery()
Documenta parámetros de query.

```typescript
@Get()
@ApiQuery({
  name: 'limit',
  required: false,
  description: 'Número de resultados por página',
  example: 10
})
@ApiQuery({
  name: 'offset',
  required: false,
  description: 'Número de resultados a saltar',
  example: 0
})
findAll(@Query() paginationDto: PaginationDto) {
  return this.productsService.findAll(paginationDto);
}
```

## Diferencias entre @ApiBody y @ApiProperty

| Aspecto | @ApiProperty | @ApiBody |
|---------|--------------|----------|
| **Ubicación** | En DTOs (`.dto.ts`) | En controladores (`.controller.ts`) |
| **Propósito** | Documenta schemas/estructura | Ejemplos para testing |
| **Aparece en** | Sección "Schemas" | Dropdown de ejemplos en endpoints |
| **Información** | Descripción, tipo, validaciones | Objetos completos de ejemplo |
| **Cantidad** | Un ejemplo por campo | Múltiples ejemplos completos |

## Configuración Avanzada

### Agregar Autenticación Bearer (JWT)

Para que Swagger muestre el icono del candado 🔒 y permita agregar tokens JWT:

#### 1. Configurar en main.ts

```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('Teslo Shop API')
  .setDescription('Teslo shop endpoints')
  .setVersion('1.0')
  .addBearerAuth() // ⬅️ Habilita autenticación Bearer
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

#### 2. Agregar @ApiBearerAuth() en las rutas protegidas

Opción A: En cada endpoint individualmente
```typescript
import { ApiBearerAuth } from '@nestjs/swagger';

@Get('profile')
@UseGuards(AuthGuard())
@ApiBearerAuth() // ⬅️ Marca esta ruta como protegida
getProfile(@GetUser() user: User) {
  return user;
}
```

Opción B: En el decorador @Auth() (Recomendado)
```typescript
// auth/decorators/auth.decorator.ts
import { ApiBearerAuth } from '@nestjs/swagger';

export function Auth(...roles: ValidRoles[]) {
  return applyDecorators(
    RoleProtected(...roles),
    UseGuards(AuthGuard(), UserRoleGuard),
    ApiBearerAuth(), // ⬅️ Incluido automáticamente
  );
}
```

Con esta configuración, todas las rutas con `@Auth()` mostrarán el candado.

#### 3. Usar en Swagger UI

1. **Login**: Ejecuta `POST /api/auth/login` con credenciales válidas
   ```json
   {
     "email": "admin@teslo.com",
     "password": "Admin123"
   }
   ```

2. **Copiar token**: De la respuesta, copia el valor del campo `token`

3. **Autorizar**:
   - Click en el botón **"Authorize"** (candado) arriba a la derecha
   - Pega el token (solo el token, sin "Bearer")
   - Click **"Authorize"**
   - Click **"Close"**

4. **Probar**: Ahora puedes ejecutar rutas protegidas. Swagger agregará automáticamente el header:
   ```
   Authorization: Bearer <tu-token>
   ```

#### Troubleshooting

**Problema**: El candado no aparece o no se abre
- ✅ Verifica que `.addBearerAuth()` esté en main.ts
- ✅ Verifica que `@ApiBearerAuth()` esté en las rutas (o en @Auth)
- ✅ Reinicia la aplicación

**Problema**: Token no se envía en las peticiones
- ✅ Verifica que hiciste click en "Authorize"
- ✅ Verifica que el token no tenga espacios al inicio/final
- ✅ No agregues "Bearer" manualmente, Swagger lo hace automáticamente

### Ocultar Endpoints
```typescript
@ApiExcludeEndpoint()
@Get('internal')
internalEndpoint() {
  // No aparecerá en Swagger
}
```

### Agrupar Controladores
```typescript
@ApiTags('Products')
@Controller('products')
export class ProductsController {}

@ApiTags('Files')
@Controller('files')
export class FilesController {}
```

## Beneficios

1. **Documentación automática**: Se actualiza con tu código
2. **Testing integrado**: Prueba endpoints sin Postman
3. **Validación visual**: Ves campos requeridos y tipos
4. **Colaboración**: Otros desarrolladores entienden la API
5. **Generación de clientes**: Exporta definición OpenAPI

## Exportar Definición

Para generar archivo JSON de OpenAPI:

```typescript
const document = SwaggerModule.createDocument(app, config);

// Guardar en archivo
const fs = require('fs');
fs.writeFileSync('./swagger.json', JSON.stringify(document));
```

Este archivo puede usarse para generar clientes automáticamente en otros lenguajes.
