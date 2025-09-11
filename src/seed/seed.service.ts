import { Injectable } from '@nestjs/common';
import { CarsSeed } from './data/cars.seed';
import { BrandsSeed } from './data/brands.seed';
import { CarsService } from 'src/cars/cars.service';
import { BrandsService } from 'src/brands/brands.service';

@Injectable()
export class SeedService {

  constructor(
    private readonly carsService: CarsService,
    private readonly brandsService: BrandsService
  ){}

  populateDB(){
    this.carsService.fillCarsWithSeedData(CarsSeed)
    this.brandsService.fillBrandsWithSeedData(BrandsSeed)

    return 'Seed executed';
  }
}
