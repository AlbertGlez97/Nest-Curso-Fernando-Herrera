# Patterns de Helpers en NestJS

## Dos Enfoques para Helpers

En NestJS, los helpers pueden implementarse de dos formas según sus necesidades:

### 1. Funciones Simples (Sin @Injectable)

**¿Cuándo usar?**
- No necesitas inyección de dependencias
- Todo lo que necesitas viene por parámetros
- Lógica pura y sin estado

**Ejemplo: fileFilter en Files Module**

```typescript
// helpers/fileFilter.helper.ts
export const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  callback: Function,
) => {
  const fileExtension = file.mimetype.split('/')[1];
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];

  if (validExtensions.includes(fileExtension)) {
    callback(null, true);   // ✅ Acepta archivo
  } else {
    callback(null, false);  // ❌ Rechaza archivo
  }
};
```

**Características:**
- ❌ **NO tiene** `@Injectable()`
- ❌ **NO necesita** estar en `providers` del módulo
- ✅ Es una **función pura** (pure function)
- ✅ Recibe todo lo que necesita por parámetros
- ✅ Se importa y usa directamente

**Uso:**
```typescript
import { fileFilter } from './helpers';

@UseInterceptors(
  FileInterceptor('file', {
    fileFilter: fileFilter,  // Solo referencia a la función
  }),
)
```

### 2. Clases Inyectables (Con @Injectable)

**¿Cuándo usar?**
- Necesitas inyectar servicios (ConfigService, Logger, Repository, etc.)
- Necesitas mantener estado
- Quieres aprovechar el sistema de inyección de dependencias de NestJS

**Ejemplo: ProductImageUrlHelper en Products Module**

```typescript
// helpers/product-image-url.helper.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProductImageUrlHelper {
  constructor(private readonly configService: ConfigService) {}

  transform(imageUrl: string): string {
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    const hostApi = this.configService.get<string>('HOST_API');
    return `${hostApi}/files/product/${imageUrl}`;
  }
}
```

**Características:**
- ✅ **Tiene** `@Injectable()` decorator
- ✅ **Debe** estar en `providers` del módulo
- ✅ **Puede** inyectar otras dependencias
- ✅ NestJS gestiona su ciclo de vida e instanciación
- ✅ Se inyecta en el constructor de otros servicios

**Configuración en el módulo:**
```typescript
// products.module.ts
@Module({
  providers: [
    ProductsService,
    ProductImageUrlHelper,  // ✅ Debe estar registrado aquí
  ],
  imports: [ConfigModule],  // ✅ Necesario para inyectar ConfigService
})
export class ProductsModule {}
```

**Uso:**
```typescript
// products.service.ts
export class ProductsService {
  constructor(
    private readonly productImageUrlHelper: ProductImageUrlHelper,
  ) {}

  async findAll() {
    return products.map(product => ({
      ...product,
      images: product.images?.map(img =>
        this.productImageUrlHelper.transform(img.url)
      ),
    }));
  }
}
```

## Comparación Directa

| Aspecto | Función Simple | Clase @Injectable() |
|---------|----------------|---------------------|
| **Decorador** | ❌ No usa `@Injectable()` | ✅ Usa `@Injectable()` |
| **En providers** | ❌ No necesario | ✅ Obligatorio |
| **Inyección de Dependencias** | ❌ No puede inyectar servicios | ✅ Puede inyectar servicios |
| **Estado** | ❌ Sin estado (stateless) | ✅ Puede mantener estado |
| **Uso** | Import directo | Inyección en constructor |
| **Ejemplo** | `fileFilter`, `fileNamer` | `ProductImageUrlHelper` |

## ¿Por qué fileFilter NO está en providers?

```typescript
// ❌ Si intentaras usar dependencias en fileFilter:
export const fileFilter = (req, file, callback) => {
  // ¿De dónde saco ConfigService? ❌ No hay forma
  const config = ???
}

// ✅ Solución: Función simple sin dependencias
export const fileFilter = (req, file, callback) => {
  // Todo viene por parámetros ✅
  const validExtensions = ['jpg', 'png'];
  // Lógica pura sin dependencias externas
}
```

## ¿Por qué ProductImageUrlHelper SÍ está en providers?

```typescript
// ✅ Necesita ConfigService para obtener HOST_API
@Injectable()
export class ProductImageUrlHelper {
  constructor(private configService: ConfigService) {} // ✅ NestJS lo inyecta

  transform(imageUrl: string): string {
    // Accede a variables de entorno a través del servicio inyectado
    const hostApi = this.configService.get('HOST_API');
    return `${hostApi}/files/product/${imageUrl}`;
  }
}
```

## Regla de Oro

**Si tu helper necesita acceder a:**
- ✅ ConfigService → Usa clase `@Injectable()`
- ✅ Logger → Usa clase `@Injectable()`
- ✅ Repository → Usa clase `@Injectable()`
- ✅ Cualquier otro servicio → Usa clase `@Injectable()`

**Si tu helper solo necesita:**
- ✅ Parámetros de entrada → Usa función simple
- ✅ Lógica pura sin dependencias → Usa función simple
- ✅ Transformaciones de datos → Usa función simple

## Ventajas de Clases Inyectables

1. **Acceso a servicios**: Pueden usar ConfigService, Logger, etc.
2. **Testeo más fácil**: Puedes mockear las dependencias inyectadas
3. **Reutilización**: NestJS crea una única instancia (singleton por defecto)
4. **Organización**: Sigue los patrones de NestJS
5. **Escalabilidad**: Fácil agregar más dependencias en el futuro

## Ventajas de Funciones Simples

1. **Simplicidad**: No requiere configuración de módulo
2. **Ligeras**: Sin overhead del sistema de inyección
3. **Portables**: Fáciles de mover entre proyectos
4. **Predecibles**: Sin efectos secundarios
5. **Fáciles de testear**: Solo pruebas unitarias simples

## Ejemplos Adicionales

### Función Simple: Formateo de Texto

```typescript
// helpers/text-formatter.helper.ts
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};
```

**Uso:**
```typescript
import { slugify, capitalize } from './helpers/text-formatter.helper';

const slug = slugify('Hola Mundo!');  // "hola-mundo"
const title = capitalize('hola');      // "Hola"
```

### Clase Injectable: Logger Personalizado

```typescript
// helpers/custom-logger.helper.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CustomLoggerHelper {
  private readonly logger = new Logger(CustomLoggerHelper.name);

  logRequest(method: string, url: string) {
    this.logger.log(`${method} ${url}`);
  }

  logError(error: Error) {
    this.logger.error(error.message, error.stack);
  }
}
```

**Configuración:**
```typescript
@Module({
  providers: [CustomLoggerHelper],
  exports: [CustomLoggerHelper],
})
```

**Uso:**
```typescript
@Injectable()
export class ProductsService {
  constructor(
    private readonly customLogger: CustomLoggerHelper,
  ) {}

  async findAll() {
    this.customLogger.logRequest('GET', '/products');
    // ...
  }
}
```

## Testing

### Testing de Función Simple

```typescript
import { slugify } from './text-formatter.helper';

describe('slugify', () => {
  it('should convert text to slug', () => {
    expect(slugify('Hola Mundo')).toBe('hola-mundo');
  });
});
```

### Testing de Clase Injectable

```typescript
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ProductImageUrlHelper } from './product-image-url.helper';

describe('ProductImageUrlHelper', () => {
  let helper: ProductImageUrlHelper;
  let configService: ConfigService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductImageUrlHelper,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:3000/api'),
          },
        },
      ],
    }).compile();

    helper = module.get<ProductImageUrlHelper>(ProductImageUrlHelper);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should transform relative URL to absolute', () => {
    const result = helper.transform('image.jpg');
    expect(result).toBe('http://localhost:3000/api/files/product/image.jpg');
  });
});
```
