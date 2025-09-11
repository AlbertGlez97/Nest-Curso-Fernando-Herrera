import { v4 as uuid } from 'uuid';
import { Cars } from "src/cars/interfaces/cars.interface";

export const CarsSeed: Cars[] = [
  {
    id: uuid(),
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020,
  },
  {
    id: uuid(),
    brand: 'Honda',
    model: 'Civic',
    year: 2019,
  },
  {
    id: uuid(),
    brand: 'Ford',
    model: 'Mustang',
    year: 2021,
  },
];
