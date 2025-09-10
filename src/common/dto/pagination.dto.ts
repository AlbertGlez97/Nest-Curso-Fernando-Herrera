import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min } from 'class-validator';

export class PaginationDto {
  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  @Min(1)
  limit?: number;

  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  offset?: number;
}
