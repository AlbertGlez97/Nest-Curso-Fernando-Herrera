import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT!);
  console.log(`Application is running on: ${await app.getUrl()}/api`); // Muestra la URL completa con el prefijo
  console.log(`Swagger UI is available at: ${await app.getUrl()}/api/docs`); // URL de Swagger UI
}
bootstrap();
