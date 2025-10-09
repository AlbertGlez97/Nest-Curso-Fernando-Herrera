# Validación y DTOs

## ¿Qué es un DTO?

**DTO (Data Transfer Object)** es un objeto que define cómo se enviarán los datos a través de la red. En NestJS, los DTOs también se usan para:
- Validar datos de entrada
- Transformar datos automáticamente
- Documentar la API (con Swagger)
- Definir tipos TypeScript

## Configuración Global

### main.ts

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Elimina propiedades no definidas
    forbidNonWhitelisted: true,   // Lanza error si hay propiedades extra
    transform: true,              // Transforma a los tipos del DTO
  }),
);
```

### Opciones Explicadas

#### `whitelist: true`
Elimina automáticamente propiedades que no están en el DTO.

```typescript
// Request body:
{ title: 'Producto', extraField: 'valor' }

// Con whitelist: true
// ✅ Recibido: { title: 'Producto' }
// extraField es eliminado
```

#### `forbidNonWhitelisted: true`
Lanza un error 400 si hay propiedades no permitidas.

```typescript
// Request body:
{ title: 'Producto', extraField: 'valor' }

// Con forbidNonWhitelisted: true
// ❌ Error 400: "property extraField should not exist"
```

#### `transform: true`
Convierte automáticamente los tipos de datos.

```typescript
// Query: ?limit=10&offset=5
// Sin transform: limit y offset son strings
// Con transform: limit y offset son numbers
```

## Instalación de Dependencias

```bash
yarn add class-validator class-transformer
```

- **class-validator**: Decoradores para validación
- **class-transformer**: Transformación de objetos

## Decoradores de Validación

### Strings

```typescript
@IsString()
title: string;

@IsString()
@MinLength(1)
title: string;

@IsString()
@MaxLength(100)
title: string;

@IsString()
@IsOptional()  // Permite undefined
description?: string;
```

### Números

```typescript
@IsNumber()
price: number;

@IsInt()
stock: number;

@IsPositive()
price: number;

@Min(0)
stock: number;

@Max(1000)
stock: number;
```

### Booleanos

```typescript
@IsBoolean()
isActive: boolean;
```

### Fechas

```typescript
@IsDate()
createdAt: Date;
```

### Arrays

```typescript
@IsArray()
@IsString({ each: true })  // Cada elemento debe ser string
sizes: string[];

@IsArray()
@IsNumber({}, { each: true })
prices: number[];

@ArrayMinSize(1)
@IsArray()
sizes: string[];
```

### Enums

```typescript
@IsIn(['men', 'women', 'kid', 'unisex'])
gender: string;

@IsEnum(Gender)
gender: Gender;
```

### Emails y URLs

```typescript
@IsEmail()
email: string;

@IsUrl()
website: string;
```

### Valores Opcionales

```typescript
@IsString()
@IsOptional()
description?: string;
```

## DTO de Ejemplo Completo

### CreateProductDto

```typescript
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  // Campo requerido
  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Camiseta Nike Básica',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  title: string;

  // Campo opcional numérico
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

  // Campo opcional de texto
  @ApiProperty({
    description: 'Descripción del producto',
    example: 'Camiseta de algodón 100%',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  // Slug opcional con generación automática
  @ApiProperty({
    description: 'URL amigable (se genera automáticamente)',
    example: 'camiseta-nike-basica',
    required: false,
  })
  @IsString()
  @IsOptional()
  slug?: string;

  // Número entero positivo
  @ApiProperty({
    description: 'Cantidad en inventario',
    example: 50,
    minimum: 0,
    required: false,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  stock?: number;

  // Array de strings requerido
  @ApiProperty({
    description: 'Tallas disponibles',
    example: ['S', 'M', 'L', 'XL'],
    isArray: true,
    type: String,
  })
  @IsString({ each: true })
  @IsArray()
  sizes: string[];

  // Enum - valores específicos
  @ApiProperty({
    description: 'Género al que está dirigido',
    example: 'unisex',
    enum: ['men', 'women', 'kid', 'unisex'],
  })
  @IsIn(['men', 'women', 'kid', 'unisex'])
  gender: string;

  // Array opcional
  @ApiProperty({
    description: 'Etiquetas para filtrado',
    example: ['nike', 'deportivo'],
    isArray: true,
    type: String,
    required: false,
  })
  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  tags?: string[];

  // Array de URLs opcional
  @ApiProperty({
    description: 'URLs de imágenes',
    example: ['https://example.com/image1.jpg'],
    isArray: true,
    type: String,
    required: false,
  })
  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  images?: string[];
}
```

### UpdateProductDto

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// PartialType hace todos los campos opcionales
export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

**`PartialType`** convierte automáticamente todos los campos del DTO en opcionales.

### PaginationDto

```typescript
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsPositive()
  @Type(() => Number)  // Transforma string a número
  limit?: number;

  @IsOptional()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}
```

## Transformaciones con class-transformer

### @Type()
Convierte tipos automáticamente.

```typescript
@Type(() => Number)
limit?: number;

@Type(() => Date)
createdAt: Date;

@Type(() => Boolean)
isActive: boolean;
```

### @Transform()
Transformación personalizada.

```typescript
@Transform(({ value }) => value.toLowerCase())
@IsString()
email: string;

@Transform(({ value }) => value.trim())
@IsString()
title: string;
```

## Validación Personalizada

### Crear Validador Custom

```typescript
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsSlugConstraint implements ValidatorConstraintInterface {
  validate(slug: string) {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  }

  defaultMessage() {
    return 'El slug debe tener formato válido (lowercase-with-dashes)';
  }
}

export function IsSlug(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSlugConstraint,
    });
  };
}
```

### Usar Validador Custom

```typescript
@IsSlug()
slug: string;
```

## Mensajes de Error Personalizados

```typescript
@IsString({ message: 'El título debe ser un texto' })
@MinLength(1, { message: 'El título no puede estar vacío' })
title: string;

@IsPositive({ message: 'El precio debe ser positivo' })
price: number;
```

## Validación de Objetos Anidados

```typescript
class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;
}

class UserDto {
  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}
```

## Errores de Validación

Cuando falla la validación, NestJS responde automáticamente con:

```json
{
  "statusCode": 400,
  "message": [
    "title should not be empty",
    "price must be a positive number",
    "sizes must be an array"
  ],
  "error": "Bad Request"
}
```
