# Manejo de Archivos con Multer

## Conceptos Clave

### 1. Multer
**Middleware de Node.js** para manejar `multipart/form-data` (subida de archivos).

**Funcionalidades:**
- Parsea archivos del body HTTP
- Ejecuta validaciones personalizadas (fileFilter)
- Guarda archivos en disco o memoria
- Genera nombres de archivo personalizados (fileNamer)

### 2. multipart/form-data
Tipo de codificación HTTP para enviar archivos en peticiones.

```http
POST /api/files/product HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="foto.jpg"
Content-Type: image/jpeg

[BYTES DE LA IMAGEN]
------WebKitFormBoundary--
```

**Diferencias:**
- `application/json`: Solo texto/datos estructurados
- `multipart/form-data`: Archivos binarios + campos de texto

## Instalación

Multer viene incluido con `@nestjs/platform-express`, pero necesitas tipos:

```bash
yarn add -D @types/multer
```

## Configuración Básica

### FileInterceptor

```typescript
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Controller('files')
export class FilesController {
  @Post('product')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: fileFilter,
      storage: diskStorage({
        destination: './static/products',
        filename: fileNamer,
      }),
    }),
  )
  uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Asegúrate de que el archivo sea una imagen');
    }

    return { filename: file.filename };
  }
}
```

### Flujo de Ejecución

```
Cliente envía archivo
    ↓
FileInterceptor intercepta
    ↓
Ejecuta fileFilter (validación)
    ↓
Si válido: Ejecuta fileNamer (renombrado)
    ↓
Guarda archivo en disco
    ↓
Inyecta archivo en @UploadedFile()
    ↓
Método del controlador
```

## Helpers de Multer

### fileFilter - Validación de Archivos

```typescript
// helpers/fileFilter.helper.ts
export const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  callback: Function,
) => {
  if (!file) return callback(new Error('Archivo vacío'), false);

  const fileExtension = file.mimetype.split('/')[1];
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];

  if (validExtensions.includes(fileExtension)) {
    callback(null, true);   // ✅ Acepta archivo
  } else {
    callback(null, false);  // ❌ Rechaza archivo
  }
};
```

**Resultado:**
- `callback(null, true)` → Multer guarda el archivo
- `callback(null, false)` → Multer NO guarda, `file` será `undefined`

### fileNamer - Generación de Nombres Únicos

```typescript
// helpers/fileNamer.helper.ts
import { v4 as uuid } from 'uuid';

export const fileNamer = (
  req: Express.Request,
  file: Express.Multer.File,
  callback: Function,
) => {
  if (!file) return callback(new Error('Archivo vacío'), false);

  const fileExtension = file.mimetype.split('/')[1];
  const fileName = `${uuid()}.${fileExtension}`;

  callback(null, fileName);
};
```

**Ejemplo:**
- Archivo original: `foto-producto.jpg`
- Nombre generado: `a3f5c8d9-1234-5678-90ab-cdef12345678.jpeg`

### Barrel File (index.ts)

```typescript
// helpers/index.ts
export { fileFilter } from './fileFilter.helper';
export { fileNamer } from './fileNamer.helper';
```

**Beneficio:**
```typescript
// ✅ Con barrel file
import { fileFilter, fileNamer } from './helpers';

// ❌ Sin barrel file
import { fileFilter } from './helpers/fileFilter.helper';
import { fileNamer } from './helpers/fileNamer.helper';
```

## UUID para Nombres de Archivo

### Instalación

```bash
yarn add uuid
yarn add -D @types/uuid
```

### ¿Por qué UUID?

**UUID v4** (Identificador Único Universal):
- 128 bits de aleatoriedad
- Formato: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- Probabilidad de colisión: 1 en 2^122
- No requiere servidor central

**Beneficios:**
1. Evita colisiones (dos archivos con el mismo nombre)
2. Seguridad (no se puede predecir el nombre)
3. Unicidad garantizada globalmente

## MIME Types

**MIME Type**: Identificador estándar del tipo de contenido.

**Formato:** `tipo/subtipo`

**Ejemplos:**
- `image/jpeg` → Imagen JPEG
- `image/png` → Imagen PNG
- `image/gif` → Imagen GIF
- `application/pdf` → Documento PDF
- `text/plain` → Texto plano

**Uso:**
```typescript
file.mimetype.split('/')[1]  // Extrae subtipo
// "image/jpeg" → "jpeg"
```

## Servir Archivos Estáticos

### Método 1: ServeStaticModule

```typescript
// app.module.ts
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
  ],
})
```

**Uso:** Sirve archivos directamente desde carpeta pública.
```
http://localhost:3000/index.html
```

### Método 2: Endpoint Personalizado (Recomendado)

```typescript
@Get('product/:imageName')
findProductImage(
  @Res() res: Response,
  @Param('imageName') imageName: string,
) {
  const path = this.filesService.getStaticProductImage(imageName);
  res.sendFile(path);
}
```

**Servicio:**
```typescript
@Injectable()
export class FilesService {
  getStaticProductImage(imageName: string) {
    const path = join(__dirname, '../../static/products', imageName);

    if (!existsSync(path)) {
      throw new NotFoundException(`Imagen ${imageName} no encontrada`);
    }

    return path;
  }
}
```

**Ventajas:**
- Control total sobre validación
- Manejo de errores personalizado
- Posibilidad de autenticación/autorización

## @Res() Decorator

**Acceso directo al objeto Response de Express.**

```typescript
@Get('product/:imageName')
findProductImage(@Res() res: Response, @Param('imageName') imageName: string) {
  const path = this.filesService.getStaticProductImage(imageName);
  res.sendFile(path);
}
```

**Importante:**
- Al usar `@Res()`, NestJS NO maneja la respuesta automáticamente
- Debes llamar manualmente a `res.sendFile()`, `res.json()`, etc.
- Se usa para enviar archivos binarios eficientemente

## res.sendFile()

**Método de Express que envía archivos como respuesta HTTP.**

**Funcionalidades automáticas:**
- Detecta el tipo MIME (image/jpeg, image/png, etc.)
- Establece `Content-Type` correcto
- Establece `Content-Length` (tamaño del archivo)
- Maneja headers de caché
- Envía el archivo como stream binario

## __dirname

**Variable de Node.js con la ruta absoluta del directorio actual.**

```typescript
// Archivo en: C:/proyecto/dist/files/files.service.js
console.log(__dirname);
// Output: "C:/proyecto/dist/files"

const path = join(__dirname, '../../static/products', 'foto.jpg');
// Output: "C:/proyecto/static/products/foto.jpg"
```

## Generar URL de Archivo

```typescript
@Post('product')
@UseInterceptors(FileInterceptor('file', { /* ... */ }))
uploadProductImage(
  @UploadedFile() file: Express.Multer.File,
) {
  if (!file) {
    throw new BadRequestException('El archivo es requerido');
  }

  const secureUrl = `${this.configService.get('HOST_API')}/files/product/${file.filename}`;

  return { secureUrl };
}
```

**Respuesta:**
```json
{
  "secureUrl": "http://localhost:3000/api/files/product/a3f5c8d9-1234.jpeg"
}
```

## Propiedades del Objeto File

```typescript
@UploadedFile() file: Express.Multer.File
```

**Propiedades disponibles:**
- `filename`: Nombre final del archivo
- `originalname`: Nombre original del archivo
- `mimetype`: Tipo MIME (`image/jpeg`)
- `size`: Tamaño en bytes
- `path`: Ruta física en disco
- `destination`: Carpeta de destino

## Flujo Completo

### Subida de Imagen

1. **Cliente envía imagen** → POST `/api/files/product` con `multipart/form-data`
2. **FileInterceptor intercepta** → Procesa el archivo antes del controlador
3. **fileFilter valida** → Verifica que sea imagen (jpg, jpeg, png, gif)
4. **fileNamer genera UUID** → Crea nombre único: `a3f5c8d9-1234.jpeg`
5. **Multer guarda en disco** → Almacena en `./static/products/`
6. **Controlador construye URL** → `http://localhost:3000/api/files/product/a3f5c8d9-1234.jpeg`
7. **Retorna respuesta** → `{ "secureUrl": "http://..." }`

### Obtención de Imagen

1. **Cliente solicita imagen** → GET `/api/files/product/a3f5c8d9-1234.jpeg`
2. **FilesService verifica existencia** → Usa `existsSync()` para validar
3. **Construye ruta física** → `C:/proyecto/static/products/a3f5c8d9-1234.jpeg`
4. **Express envía archivo** → `res.sendFile(path)` con headers correctos
5. **Cliente recibe imagen** → Navegador la muestra o descarga

## Documentación Swagger

```typescript
@Post('product')
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary',
      },
    },
  },
})
uploadProductImage(@UploadedFile() file: Express.Multer.File) {
  // ...
}
```

## Múltiples Archivos

### FilesInterceptor

```typescript
@Post('multiple')
@UseInterceptors(FilesInterceptor('files', 10))  // Máximo 10 archivos
uploadMultipleFiles(@UploadedFiles() files: Express.Multer.File[]) {
  return files.map(file => file.filename);
}
```

### Múltiples Campos

```typescript
@Post('fields')
@UseInterceptors(FileFieldsInterceptor([
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 5 },
]))
uploadFields(@UploadedFiles() files: {
  avatar?: Express.Multer.File[],
  gallery?: Express.Multer.File[]
}) {
  return {
    avatar: files.avatar?.[0]?.filename,
    gallery: files.gallery?.map(f => f.filename),
  };
}
```
