// https://docs.nestjs.com/techniques/file-upload
import {
  Controller,
  Get,
  Post,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { fileFilter, fileNamer } from './helpers';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';

// =========================================================================
// CONTROLADOR DE ARCHIVOS - ENDPOINTS PARA SUBIR Y OBTENER IMÁGENES
// =========================================================================

// @ApiTags('Files'): Agrupa estos endpoints bajo la categoría "Files" en Swagger
@ApiTags('Files')

// Ruta base: /api/files (el /api viene del globalPrefix en main.ts)
@Controller('files')
export class FilesController {

  // INYECCIÓN DE DEPENDENCIAS:
  constructor(
    // FilesService: Lógica de negocio para manejo de archivos
    private readonly filesService: FilesService,

    // ConfigService: Permite acceder a variables de entorno del .env
    private readonly configService: ConfigService,
  ) {}

  // =========================================================================
  // ENDPOINT GET: Obtener/Visualizar una imagen de producto
  // =========================================================================
  // Ruta completa: GET /api/files/product/:imageName
  // Ejemplo: GET /api/files/product/a3f5c8d9-1234-5678.jpeg
  //
  // Este endpoint retorna el archivo de imagen para que el navegador lo muestre

  @Get('product/:imageName')
  findProductImage(
    // @Res() res: Acceso directo al objeto Response de Express
    // IMPORTANTE: Al usar @Res(), NestJS deja de manejar la respuesta automáticamente
    // Tú eres responsable de enviar la respuesta con res.sendFile(), res.json(), etc.
    @Res() res: Response,

    // @Param('imageName'): Extrae el parámetro dinámico de la URL
    // Si la URL es /api/files/product/foto.jpg, imageName = "foto.jpg"
    @Param('imageName') imageName: string,
  ) {
    // Obtiene la ruta física del archivo en el servidor
    // Si el archivo no existe, el servicio lanza una excepción
    const path = this.filesService.getStaticProductImage(imageName);

    // res.sendFile(): Método de Express que envía un archivo como respuesta
    // Establece automáticamente:
    // - Content-Type correcto (image/jpeg, image/png, etc.)
    // - Content-Length (tamaño del archivo)
    // - Headers de caché
    //
    // El navegador recibe la imagen y la muestra/descarga
    res.sendFile(path);
  }

  // =========================================================================
  // ENDPOINT POST: Subir una imagen de producto
  // =========================================================================
  // Ruta completa: POST /api/files/product
  // Body: multipart/form-data con un campo "file"
  //
  // Este endpoint recibe una imagen, la valida, la guarda en disco,
  // y retorna la URL pública para acceder a ella

  @Post('product')

  // @ApiConsumes: Le dice a Swagger que este endpoint consume archivos
  // Sin esto, Swagger no mostraría el botón "Choose File"
  @ApiConsumes('multipart/form-data')

  // @ApiBody: Define el esquema del body para Swagger
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        // Define un campo "file" de tipo binario (archivo)
        file: {
          type: 'string',
          format: 'binary',  // Le dice a Swagger que muestre un selector de archivos
        },
      },
    },
  })

  // @UseInterceptors: Interceptor que procesa el archivo ANTES de llegar al método
  // Es el corazón del proceso de subida de archivos
  @UseInterceptors(
    // FileInterceptor: Interceptor de NestJS/Multer para manejar archivos
    // Parámetro 1: 'file' -> nombre del campo en el formulario multipart
    FileInterceptor('file', {

      // CONFIGURACIÓN 1: fileFilter
      // Función que valida el tipo de archivo ANTES de guardarlo
      // fileFilter verifica que sea una imagen (jpg, jpeg, png, gif)
      // Si fileFilter retorna false, Multer NO guarda el archivo
      fileFilter: fileFilter,

      // CONFIGURACIÓN 2: storage
      // Define DÓNDE y CÓMO se guarda el archivo
      storage: diskStorage({

        // destination: Carpeta donde se guardarán los archivos
        // './static/products' -> ruta relativa desde la raíz del proyecto
        destination: './static/products',

        // filename: Función que genera el nombre del archivo
        // fileNamer genera un nombre único usando UUID
        // Esto evita colisiones y sobrescrituras
        filename: fileNamer,
      }),
    }),
  )

  // MÉTODO DEL CONTROLADOR:
  // @UploadedFile() file: Inyecta el archivo procesado por Multer
  // Si Multer aceptó el archivo, 'file' contiene información del archivo
  // Si Multer rechazó el archivo (fileFilter retornó false), 'file' es undefined
  uploadProductImage(@UploadedFile() file: Express.Multer.File) {

    // VALIDACIÓN FINAL: Verificar que el archivo existe
    // Si fileFilter rechazó el archivo, file será undefined
    // Lanzamos una excepción 400 (Bad Request) con un mensaje claro
    if (!file) {
      throw new BadRequestException('Make sure that the file is an image');
    }

    // CONSTRUCCIÓN DE LA URL PÚBLICA:
    // Creamos la URL completa para acceder a la imagen desde el cliente
    //
    // this.configService.get('HOST_API'): Obtiene la URL base del .env
    //   Valor: "http://localhost:50278/api"
    //
    // '/files/product/': Ruta del endpoint GET que sirve imágenes
    //
    // file.filename: Nombre único generado por fileNamer
    //   Ejemplo: "a3f5c8d9-1234-5678-90ab-cdef12345678.jpeg"
    //
    // URL FINAL: "http://localhost:50278/api/files/product/a3f5c8d9-1234-5678.jpeg"
    const secureUrl = `${this.configService.get('HOST_API')}/files/product/${file.filename}`;

    // RESPUESTA: Retorna un objeto JSON con la URL de la imagen
    // El cliente puede usar esta URL para mostrar la imagen en la interfaz
    // Ejemplo de respuesta:
    // {
    //   "secureUrl": "http://localhost:50278/api/files/product/a3f5c8d9-1234.jpeg"
    // }
    return {
      secureUrl,
    };
  }
}
