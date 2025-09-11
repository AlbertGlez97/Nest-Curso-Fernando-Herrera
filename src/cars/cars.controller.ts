import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dtos/create-car.dto';
import { UpdateCarDto } from './dtos/update-car.dto';

// Define el controlador para la ruta 'cars'
@Controller('cars')
export class CarsController {
  // Inyecta el servicio de coches en el controlador
  constructor(private readonly carsService: CarsService) {}

  // Endpoint para obtener todos los coches
  @Get()
  getAllCars() {
    return this.carsService.findAll();
  }

  // Endpoint para obtener un coche por su id (UUID)
  @Get(':id')
  getCarById(@Param('id', ParseUUIDPipe) id: string) {
    return this.carsService.findOneById(id);
  }

  // Endpoint para crear un nuevo coche
  @Post()
  createCar(@Body() createCarDto: CreateCarDto) {
    return this.carsService.create(createCarDto);
  }

  // Endpoint para actualizar un coche existente por su id
  @Patch(':id')
  updateCar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCarDto: UpdateCarDto,
  ) {
    return this.carsService.update(id, updateCarDto);
  }

  // Endpoint para eliminar un coche por su id
  @Delete(':id')
  deleteCar(@Param('id', ParseUUIDPipe) id: string) {
    return this.carsService.delete(id);
  }
}
