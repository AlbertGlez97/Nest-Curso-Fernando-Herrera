import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Solo permite propiedades decoradas con validadores
      forbidNonWhitelisted: true, // Rechaza peticiones con propiedades no permitidas
    }),
  );

  // Global Prefix sirve para versionar la API, esto se refiere a la URL base
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT!);

  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
