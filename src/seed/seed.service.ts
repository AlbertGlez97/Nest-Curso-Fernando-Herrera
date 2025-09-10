import { Injectable } from '@nestjs/common';
import { PokeResponse } from './interfaces/poke-response.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { Model } from 'mongoose';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';

// @Injectable() - Decorador que marca esta clase como un servicio inyectable en el sistema de DI de NestJS
@Injectable()
export class SeedService {

  constructor(
    // @InjectModel() - Decorador que inyecta un modelo de Mongoose para la entidad Pokemon
    // Permite interactuar con la colección de Pokemon en MongoDB
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,

    // Adaptador HTTP personalizado para realizar peticiones externas
    private readonly http: AxiosAdapter,
  ) {}

  // Método para poblar la base de datos con datos de Pokemon desde la PokeAPI
  async executedSeed(size: string) {

    // Realiza una petición HTTP GET a la PokeAPI para obtener una lista de Pokemon
    // El parámetro 'size' determina cuántos Pokemon se van a obtener
    const data = await this.http.get<PokeResponse>(
      'https://pokeapi.co/api/v2/pokemon?limit=' + size,
    );

    // Array temporal para almacenar los Pokemon antes de insertarlos en la BD
    const pokemonToInsert: { name: string; no: number }[] = [];

    // Itera sobre cada Pokemon obtenido de la API
    data.results.forEach(async ({ name, url }) => {
      // Extrae el número del Pokemon desde la URL
      // La URL tiene formato: https://pokeapi.co/api/v2/pokemon/1/
      const segments = url.split('/');
      const no = +segments[segments.length - 2]; // Convierte a número el penúltimo segmento

      // Añade el Pokemon al array temporal
      pokemonToInsert.push({ name, no });
    });

    // Inserta todos los Pokemon de una vez en la base de datos (operación en lote)
    await this.pokemonModel.insertMany(pokemonToInsert);

    return `Seed Executed`;
  }

  // Método para limpiar completamente la colección de Pokemon
  async cleanSeed() {
    // Elimina todos los documentos de la colección Pokemon
    await this.pokemonModel.deleteMany({}); // Equivalente a: delete * from pokemons;

    return `Clean Seed Executed`;
  }
}
