import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap')

  app.setGlobalPrefix('api');// Prefijo global para todas las rutas

  // Configuración global del ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Lanza un error si hay propiedades no definidas
      transform: true, // Transforma los payloads a los tipos definidos en los DTOs
    }),
  );

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Teslo Shop API')
    .setDescription('Teslo shop endpoints')
    .setVersion('1.0')
    .addBearerAuth() // Agrega autenticación Bearer (JWT)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Configuración del puerto de la aplicación desde variable de entorno
  await app.listen(process.env.PORT!);
  logger.log(`Application is running on: ${await app.getUrl()}/api`); // Muestra la URL completa con el prefijo
  logger.log(`Swagger UI is available at: ${await app.getUrl()}/api/docs`); // URL de Swagger UI
}
bootstrap();
