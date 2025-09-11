import { v4 as uuid } from 'uuid';
import { Brand } from 'src/brands/entities/brand.entity';
export const BrandsSeed: Brand[] = [
  {
    id: uuid(),
    name: 'Toyota',
    createAt: new Date().getTime(),
  },
  {
    id: uuid(),
    name: 'Honda',
    createAt: new Date().getTime(),
  },
  {
    id: uuid(),
    name: 'Ford',
    createAt: new Date().getTime(),
  },
  {
    id: uuid(),
    name: 'Chevrolet',
    createAt: new Date().getTime(),
  }
];
