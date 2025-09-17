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

## Configuración de Swagger UI

### ¿Qué es Swagger?
Swagger (ahora conocido como OpenAPI) es una herramienta que permite:
- **Documentar APIs automáticamente**: Genera documentación interactiva basada en tu código
- **Probar endpoints**: Interfaz web para hacer peticiones HTTP directamente
- **Validar contratos**: Asegura que la API funciona como está documentada
- **Generar clientes**: Crear código cliente en diferentes lenguajes

### Instalación de dependencias
```bash
yarn add @nestjs/swagger swagger-ui-express
```

**Explicación de las dependencias:**
- `@nestjs/swagger`: Integración oficial de Swagger con NestJS, proporciona decoradores y funcionalidades específicas
- `swagger-ui-express`: Motor que renderiza la interfaz web interactiva de Swagger

### Configuración en main.ts

Agregar los imports necesarios:
```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
```

Configurar Swagger después del ValidationPipe:
```typescript
// Configuración de Swagger
const config = new DocumentBuilder()
  .setTitle('Teslo Shop API')           // Título de la documentación
  .setDescription('Teslo shop endpoints') // Descripción general de la API
  .setVersion('1.0')                    // Versión de la API
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

Agregar console.log para mostrar la URL:
```typescript
console.log(`Swagger UI is available at: ${await app.getUrl()}/api/docs`);
```

### Explicación detallada de la configuración

**DocumentBuilder:** Construye la configuración base de Swagger
- `.setTitle()`: Define el nombre que aparecerá en la parte superior de la documentación
- `.setDescription()`: Descripción que aparece debajo del título
- `.setVersion()`: Versión de la API, útil para versionado
- `.build()`: Crea el objeto de configuración final

**SwaggerModule:**
- `.createDocument(app, config)`: Escanea toda la aplicación y genera la documentación basada en los controladores, DTOs y decoradores
- `.setup('api/docs', app, document)`: Monta la interfaz de Swagger en la ruta especificada

### Acceder a Swagger UI

Una vez configurado, ejecuta la aplicación:
```bash
yarn start:dev
```

Verás en la consola:
```
Swagger UI is available at: http://localhost:3000/api/docs
```

Abre esa URL en tu navegador para ver:
- Lista de todos los endpoints organizados por controladores
- Esquemas de los DTOs y entidades
- Interfaz para probar cada endpoint directamente
- Documentación automática de parámetros, respuestas y códigos de estado

### Beneficios de usar Swagger

1. **Documentación automática**: Se actualiza automáticamente cuando cambias tu código
2. **Testing integrado**: Puedes probar endpoints sin usar Postman o herramientas externas
3. **Validación visual**: Ves inmediatamente qué campos son requeridos y sus tipos
4. **Colaboración**: Otros desarrolladores pueden entender tu API sin explicaciones adicionales

### Agregando ejemplos en Swagger

Para mejorar la experiencia del desarrollador, puedes agregar ejemplos que aparezcan en la interfaz de Swagger.

#### Usando @ApiBody con múltiples ejemplos

En el controlador, importa los decoradores necesarios:
```typescript
import { ApiBody, ApiTags } from '@nestjs/swagger';
```

Agrega etiquetas al controlador:
```typescript
@ApiTags('Products')  // Organiza endpoints por categorías
@Controller('products')
```

Configura ejemplos en el método POST:
```typescript
@Post()
@ApiBody({
  type: CreateProductDto,
  examples: {
    example1: {
      summary: 'Producto de ejemplo',
      description: 'Ejemplo de un producto típico de la tienda',
      value: {
        title: 'Camiseta Nike Básica',
        price: 29.99,
        description: 'Camiseta de algodón 100% con logo de Nike',
        slug: 'camiseta-nike-basica',
        stock: 50,
        sizes: ['S', 'M', 'L', 'XL'],
        gender: 'unisex'
      }
    },
    example2: {
      summary: 'Producto sin campos opcionales',
      description: 'Ejemplo con solo campos requeridos',
      value: {
        title: 'Zapatos Adidas Running',
        sizes: ['38', '39', '40', '41', '42'],
        gender: 'men'
      }
    }
  }
})
create(@Body() createProductDto: CreateProductDto) {
  return this.productsService.create(createProductDto);
}
```

#### Componentes del @ApiBody

**Propiedades del ejemplo:**
- `summary`: Título corto que aparece en el dropdown
- `description`: Descripción más detallada del ejemplo
- `value`: El objeto JSON que se usará como ejemplo

**Resultado en Swagger UI:**
- Dropdown para seleccionar entre ejemplos
- Auto-completado del Request Body al seleccionar un ejemplo
- Mejora significativa en la experiencia de testing

#### Documentando Schemas con @ApiProperty

Para que los DTOs aparezcan correctamente en la sección "Schemas" de Swagger, agrega `@ApiProperty` a cada campo:

```typescript
import { ApiProperty } from '@nestjs/swagger';

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
    description: 'Tallas disponibles del producto',
    example: ['S', 'M', 'L', 'XL'],
    isArray: true,
    type: String,
  })
  @IsString({ each: true })
  @IsArray()
  sizes: string[];

  @ApiProperty({
    description: 'Género al que está dirigido el producto',
    example: 'unisex',
    enum: ['men', 'women', 'kid', 'unisex'],
  })
  @IsIn(['men', 'women', 'kid', 'unisex'])
  gender: string;
}
```

**Propiedades importantes de @ApiProperty:**
- `description`: Explica qué hace el campo
- `example`: Valor de ejemplo
- `required`: Si es obligatorio (false para campos opcionales)
- `minimum/maximum`: Valores límite para números
- `minLength/maxLength`: Longitud para strings
- `enum`: Lista de valores permitidos
- `isArray`: Indica si es un array
- `type`: Tipo de datos (útil para arrays)

**Diferencias entre @ApiBody y @ApiProperty:**

| Aspecto | @ApiProperty | @ApiBody |
|---------|-------------|----------|
| **Ubicación** | En DTOs (`.dto.ts`) | En controladores (`.controller.ts`) |
| **Propósito** | Documenta schemas/estructura | Proporciona ejemplos para testing |
| **Aparece en** | Sección "Schemas" de Swagger | Dropdown de ejemplos en endpoints |
| **Información** | Descripción, tipo, validaciones por campo | Objetos completos de ejemplo |
| **Cantidad** | Un ejemplo por campo | Múltiples ejemplos completos |

**Cuándo usar cada uno:**
- `@ApiProperty`: Para documentar la estructura y validaciones de cada campo
- `@ApiBody`: Para proporcionar datos de prueba listos para usar
- **Recomendación**: Usar ambos para una documentación completa

