import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

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

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}/api`); // Muestra la URL completa con el prefijo
}
bootstrap();
