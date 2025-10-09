import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';

// =========================================================================
// SERVICIO DE ARCHIVOS - LÓGICA DE NEGOCIO PARA MANEJO DE IMÁGENES
// =========================================================================
@Injectable()
export class FilesService {

  // =========================================================================
  // MÉTODO: getStaticProductImage
  // =========================================================================
  // Obtiene la ruta física de una imagen de producto en el servidor
  // Se usa cuando el cliente solicita ver una imagen (GET /files/product/:imageName)
  //
  // PARÁMETRO:
  // - imageName: Nombre del archivo de imagen (ej: "a3f5c8d9-1234-5678.jpeg")
  //
  // RETORNA: La ruta absoluta del archivo en el sistema de archivos
  getStaticProductImage(imageName: string) {

    // CONSTRUCCIÓN DE LA RUTA DEL ARCHIVO:
    // join() une segmentos de ruta de forma segura (maneja / y \ automáticamente)
    //
    // __dirname: Directorio actual donde está este archivo
    //   Ejemplo: "C:/proyecto/dist/files"
    //
    // '../../static/products': Sube 2 niveles y entra a static/products
    //   Desde: "C:/proyecto/dist/files"
    //   Hasta: "C:/proyecto/static/products"
    //
    // imageName: Nombre del archivo solicitado
    //   Ejemplo: "a3f5c8d9-1234-5678.jpeg"
    //
    // RUTA FINAL: "C:/proyecto/static/products/a3f5c8d9-1234-5678.jpeg"
    const path = join(__dirname, '../../static/products', imageName);

    // VALIDACIÓN: Verificar que el archivo exista en el sistema de archivos
    // existsSync() retorna true si el archivo/carpeta existe, false si no
    if (!existsSync(path)) {
      // Si el archivo no existe, lanzar excepción 400 (Bad Request)
      // Esto le dice al cliente que la imagen solicitada no está disponible
      throw new BadRequestException(`No product found with image ${imageName}`);
    }

    // Si el archivo existe, retornar la ruta completa
    // El controlador usará esta ruta para enviar el archivo al cliente
    return path;
  }
}
