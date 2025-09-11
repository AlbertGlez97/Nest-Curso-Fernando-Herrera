import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Cars } from './interfaces/cars.interface';
import { CreateCarDto, UpdateCarDto } from './dtos';


// Un injectable es una clase que puede ser instanciada y gestionada por el contenedor de inyección de dependencias de NestJS.
// esto ayuda a mantener el código modular y reutilizable.
@Injectable()
export class CarsService {
  // Arreglo privado que almacena los autos disponibles en memoria.
  private cars: Cars[] = [];

  /**
   * Retorna todos los autos almacenados en el arreglo interno.
   *
   * @returns Un arreglo con todos los autos.
   */
  findAll() {
    return this.cars;
  }

  /**
   * Busca y retorna un automóvil por su identificador único.
   *
   * @param id - El identificador único del automóvil a buscar.
   * @returns El objeto automóvil correspondiente al identificador proporcionado.
   * @throws NotFoundException Si no se encuentra un automóvil con el identificador especificado.
   */
  findOneById(id: string) {
    const car = this.cars.find((car) => car.id === id);

    if (!car) throw new NotFoundException(`Car with ID ${id} not found`);

    return car;
  }

  /**
   * Crea un nuevo auto y lo agrega al arreglo interno de autos.
   *
   * Este método recibe un objeto `createCarDto` con las propiedades del auto a crear,
   * genera un identificador único (`id`) usando la función uuid, y construye el objeto del auto.
   * Finalmente, agrega el nuevo auto al arreglo `cars` y lo retorna.
   *
   * @param createCarDto - Objeto con las propiedades necesarias para crear el auto.
   * @returns El objeto del auto recién creado.
   */
  create(createCarDto: CreateCarDto) {
    const newCar: Cars = { id: uuid(), ...createCarDto };
    this.cars.push(newCar);
    return newCar;
  }

  /**
   * Actualiza las propiedades de un auto existente identificado por su `id`.
   *
   * Este método busca el auto por su `id`, combina las propiedades proporcionadas en `updateCarDto`
   * con el objeto del auto existente y reemplaza el auto en el arreglo interno `cars`.
   * La propiedad `id` se mantiene para asegurar la consistencia.
   *
   * @param id - El identificador único del auto a actualizar.
   * @param updateCarDto - Un objeto que contiene las propiedades a actualizar en el auto.
   * @returns El objeto del auto actualizado.
   * @throws BadRequestException Si el id proporcionado en el cuerpo no coincide con el id de la ruta.
   */
  update(id: string, updateCarDto: UpdateCarDto) {
    let carDb = this.findOneById(id);

    if (updateCarDto.id && updateCarDto.id !== id)
      throw new BadRequestException('Car id is not valid inside body');

    this.cars = this.cars.map((car) => {
      if (car.id === id) {
        carDb = {
          ...carDb,
          ...updateCarDto,
          id,
        };
        return carDb;
      }
      return car;
    });
    return carDb;
  }

  /**
   * Elimina un auto del arreglo interno según su identificador único.
   *
   * @param id - El identificador único del auto a eliminar.
   * @returns El objeto del auto eliminado.
   * @throws NotFoundException Si no se encuentra un auto con el identificador especificado.
   */
  delete(id: string) {
    let carDb = this.findOneById(id);

    this.cars = this.cars.filter((car) => car.id !== id);

    return carDb;
  }

  fillCarsWithSeedData(cars: Cars[]) {
    this.cars = cars;
  }
}
