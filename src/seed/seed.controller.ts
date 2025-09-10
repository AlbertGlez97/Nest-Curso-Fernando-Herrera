import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Get(':size')
  executedSeed(@Param('size') size: string) {
    return this.seedService.executedSeed(size);
  }

  @Delete()
  cleanSeed() {
    return this.seedService.cleanSeed();
  }
}
