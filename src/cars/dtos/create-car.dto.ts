// Un DTO (Data Transfer Object) es un objeto que se utiliza para transferir datos entre diferentes capas de una aplicación, 
// especialmente entre el cliente y el servidor. En este caso, CreateCarDto define la estructura y validaciones para crear un auto.

import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

// Definición del DTO para crear un auto
export class CreateCarDto {
  // La marca del auto, debe ser una cadena y no puede estar vacía
  @IsString()
  @IsNotEmpty()
  readonly brand: string;

  // El modelo del auto, debe ser una cadena y no puede estar vacía
  @IsString()
  @IsNotEmpty()
  readonly model: string;

  // El año del auto, se transforma a número, debe ser un número y no puede estar vacío
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  readonly year: number;
}
