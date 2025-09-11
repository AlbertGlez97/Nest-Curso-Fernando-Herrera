// Este archivo define un DTO (Data Transfer Object) llamado UpdateCarDto.
// Un DTO se utiliza para transferir datos entre diferentes capas de una aplicación,
// en este caso, para actualizar la información de un automóvil en el sistema.

import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

// Definición de la clase UpdateCarDto
export class UpdateCarDto {

  // Propiedad opcional 'id', debe ser un string con formato UUID si se proporciona
  @IsString()
  @IsUUID()
  @IsOptional()
  readonly id?: string;

  // Propiedad opcional 'brand', debe ser un string si se proporciona
  @IsString()
  @IsOptional()
  readonly brand?: string;

  // Propiedad opcional 'model', debe ser un string si se proporciona
  @IsString()
  @IsOptional()
  readonly model?: string;

  // Propiedad opcional 'year', debe ser un número si se proporciona
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  readonly year?: number;
}
