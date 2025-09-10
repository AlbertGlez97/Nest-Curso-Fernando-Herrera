// Importaciones principales de NestJS
import { Module } from '@nestjs/common'; // Decorador para definir módulos en NestJS
import { ServeStaticModule } from '@nestjs/serve-static'; // Módulo para servir archivos estáticos
import { join } from 'path'; // Utilidad de Node.js para manejar rutas de archivos
import { PokemonModule } from './pokemon/pokemon.module'; // Módulo principal que contiene toda la lógica de Pokémon
import { MongooseModule } from '@nestjs/mongoose'; // Módulo para integración con MongoDB usando Mongoose
import { CommonModule } from './common/common.module'; // Módulo con funcionalidades compartidas (DTOs, pipes, interceptors)
import { SeedModule } from './seed/seed.module'; // Módulo para poblar la base de datos con datos iniciales
import { ConfigModule } from '@nestjs/config'; // Módulo para manejo de variables de entorno y configuración
import { EnvConfiguration } from './config/env.config'; // Función que mapea las variables de entorno
import { JoiValidationSchema } from './config/joi.validation'; // Esquema de validación para las variables de entorno

/**
 * CONFIGURACIÓN DEL MÓDULO PRINCIPAL DE LA APLICACIÓN
 * 
 * Este módulo raíz (AppModule) es el punto de entrada de la aplicación NestJS.
 * Aquí se configuran todos los módulos, servicios y configuraciones globales necesarias.
 */

@Module({
  imports: [
    // 1. CONFIGURACIÓN DE VARIABLES DE ENTORNO
    ConfigModule.forRoot({
      // load: Carga la configuración personalizada desde el archivo env.config.ts
      // Esta función mapea las variables de entorno a un objeto tipado
      load: [EnvConfiguration],
      
      // validationSchema: Esquema de validación usando Joi para asegurar que 
      // todas las variables de entorno requeridas estén presentes y sean válidas
      // Si la validación falla, la aplicación no se iniciará
      validationSchema: JoiValidationSchema,
    }),

    // 2. SERVIDOR DE ARCHIVOS ESTÁTICOS
    // Configura el servidor para servir archivos estáticos (HTML, CSS, JS, imágenes)
    // desde la carpeta 'public' ubicada en la raíz del proyecto
    // Ejemplo: localhost:3000/index.html servirá el archivo public/index.html
    ServeStaticModule.forRoot({ 
      rootPath: join(__dirname, '..', 'public'), 
    }),

    // 3. CONEXIÓN A BASE DE DATOS MONGODB
    // Establece la conexión con MongoDB usando la URL definida en las variables de entorno
    // El operador '!' indica que estamos seguros de que MONGODB existe (fue validado por Joi)
    // Ejemplo: mongodb://localhost:27017/nest-pokemon
    MongooseModule.forRoot(process.env.MONGODB!, {
      dbName: 'pokemondb', // Nombre de la base de datos a usar
    }),

    // 4. MÓDULOS FUNCIONALES DE LA APLICACIÓN
    PokemonModule,  // Contiene toda la lógica CRUD de Pokémon (controllers, services, schemas)
    CommonModule,   // Funcionalidades compartidas: DTOs de paginación, pipes de validación, etc.
    SeedModule,     // Servicio para poblar la base de datos con datos iniciales de Pokémon
  ],
  
  // Controllers y providers vacíos porque toda la funcionalidad está en los módulos importados
  controllers: [], // No hay controladores a nivel de módulo raíz
  providers: [],   // No hay providers a nivel de módulo raíz
})
export class AppModule {}
