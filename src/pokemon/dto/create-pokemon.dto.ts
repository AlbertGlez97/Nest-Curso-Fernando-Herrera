import { Transform } from "class-transformer";
import { IsInt, IsPositive, IsString, Min, MinLength } from "class-validator";

export class CreatePokemonDto {
    @IsInt()
    @IsPositive()
    @Min(1)
    no: number;

    @IsString()
    @MinLength(1)
    @Transform(({ value }) => value.toLowerCase())
    name: string;
}
