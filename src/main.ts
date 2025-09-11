import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import colors from "colors";

/**
 * Función principal que inicializa la aplicación NestJS
 * Esta función es asíncrona ya que la creación del servidor requiere operaciones asíncronas
 */
async function bootstrap() {
  // Crea una nueva instancia de la aplicación NestJS usando el módulo raíz AppModule
  const app = await NestFactory.create(AppModule);

  /**
   * Configura las tuberías (pipes) globales para la validación de datos
   * ValidationPipe se aplica a todas las rutas de la aplicación
   *
   * Opciones de configuración:
   * @param whitelist - Elimina propiedades que no están decoradas con validadores
   * @param forbidNonWhitelisted - Rechaza peticiones que contengan propiedades no permitidas
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Solo permite propiedades decoradas con validadores
      forbidNonWhitelisted: true, // Rechaza peticiones con propiedades no permitidas
    }),
  );

  /**
   * Inicia el servidor en el puerto especificado
   * Usa el operador de coalescencia nula (??) para establecer el puerto 3000 como valor predeterminado
   * si process.env.PORT no está definido
   */
  await app.listen(process.env.PORT ?? 3000);

  console.log(colors.blue(`Application is running on: ${await app.getUrl()}`));
  console.log(colors.green(`Press Ctrl+C to stop the server`));
}

// Ejecuta la función bootstrap para iniciar la aplicación
bootstrap();
