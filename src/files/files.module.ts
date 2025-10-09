import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { ConfigModule } from '@nestjs/config';

// =========================================================================
// MÓDULO DE ARCHIVOS - MANEJO DE SUBIDA Y SERVICIO DE IMÁGENES
// =========================================================================
@Module({
  // CONTROLADORES: Endpoints HTTP para subir y obtener imágenes
  controllers: [FilesController],

  // PROVEEDORES: Servicios inyectables del módulo
  providers: [FilesService],

  // IMPORTACIONES: Módulos externos necesarios
  imports: [
    // ConfigModule: Permite acceder a variables de entorno (.env)
    // Necesario para obtener HOST_API en el controlador
    ConfigModule
  ]
})
export class FilesModule {}
