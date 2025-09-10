// Importaciones de NestJS para manejo de excepciones y decoradores
import {
  BadRequestException,   // Excepción para errores 400 (solicitud incorrecta)
  Injectable,            // Decorador que marca la clase como inyectable en el sistema de DI
  InternalServerErrorException, // Excepción para errores 500 (error interno del servidor)
  NotFoundException,     // Excepción para errores 404 (recurso no encontrado)
} from '@nestjs/common';

// DTOs (Data Transfer Objects) - Objetos que definen la estructura de datos
import { CreatePokemonDto } from './dto/create-pokemon.dto';  // DTO para crear un Pokémon
import { UpdatePokemonDto } from './dto/update-pokemon.dto';  // DTO para actualizar un Pokémon

// Importaciones de Mongoose para trabajar con MongoDB
import { isValidObjectId, Model } from 'mongoose';  // isValidObjectId: valida si es un ObjectId válido, Model: tipo para modelos de Mongoose
import { Pokemon } from './entities/pokemon.entity';  // Entidad/Esquema del Pokémon
import { InjectModel } from '@nestjs/mongoose';        // Decorador para inyectar modelos de Mongoose
import { PaginationDto } from 'src/common/dto/pagination.dto';  // DTO para paginación
import { ConfigService } from '@nestjs/config';

// @Injectable(): Decorador que permite que esta clase sea inyectada como dependencia
// en otros componentes del sistema de inyección de dependencias de NestJS
@Injectable()
export class PokemonService {

  private defaultLimit: number;

  // Constructor con inyección de dependencias
  constructor(
    // @InjectModel(): Inyecta el modelo de Mongoose para la entidad Pokemon
    // Pokemon.name: Nombre del modelo (normalmente 'Pokemon')
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,  // Modelo de Mongoose para operaciones CRUD

    private readonly configService: ConfigService
  ) {
    this.defaultLimit = configService.get<number>('defaultLimit')!;
  }

  // Método para crear un nuevo Pokémon en la base de datos
  async create(createPokemonDto: CreatePokemonDto) {
    try {
      // Crea un nuevo documento en MongoDB usando el DTO recibido
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      // Si hay error (ej: duplicado), lo maneja con el método privado
      this.handleExceptions(error);
    }
  }

  // Método para obtener todos los Pokémon con paginación
  findAll(paginationDto: PaginationDto) {
    // Desestructuración con valores por defecto: límite de 10 y offset de 0
    const { limit = this.defaultLimit, offset = 0 } = paginationDto;

    return this.pokemonModel
      .find()                    // Busca todos los documentos
      .limit(limit)              // Limita la cantidad de resultados
      .skip(offset)              // Salta los primeros 'offset' documentos (para paginación)
      .sort({ no: 1 })           // Ordena por el campo 'no' (número del Pokémon) de forma ascendente
      .select('-__v');           // Excluye el campo '__v' (version key de Mongoose) del resultado
  }

  // Método para buscar un Pokémon por diferentes criterios (número, ID o nombre)
  async findOne(term: string) {
    let pokemon: Pokemon | null = null;

    // Primera búsqueda: Si el término es un número, busca por el campo 'no'
    if (!isNaN(+term)) {
      pokemon = await this.pokemonModel.findOne({ no: term });
    }

    // Segunda búsqueda: Si no encontró y el término es un ObjectId válido, busca por _id
    if (!pokemon && isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById(term);
    }

    // Tercera búsqueda: Si no encontró, busca por nombre (normalizado a minúsculas)
    if (!pokemon) {
      pokemon = await this.pokemonModel.findOne({
        name: term.toLocaleLowerCase().trim(),  // Convierte a minúsculas y quita espacios
      });
    }

    // Si después de todas las búsquedas no encuentra nada, lanza excepción 404
    if (!pokemon) {
      throw new NotFoundException(`Pokemon with term ${term} not found`);
    }

    return pokemon;
  }

  // Método para actualizar un Pokémon existente
  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    // Primero busca el Pokémon usando el método findOne (puede lanzar NotFoundException)
    const pokemon = await this.findOne(term);
    try {
      // Actualiza el documento en la base de datos
      await pokemon.updateOne(updatePokemonDto);
      // Retorna la combinación del Pokémon original con los datos actualizados
      // toJSON(): Convierte el documento de Mongoose a objeto JavaScript plano
      // Spread operator (...): Combina los objetos, los nuevos datos sobrescriben los anteriores
      return { ...pokemon.toJSON(), ...updatePokemonDto };
    } catch (error) {
      // Maneja errores como duplicados u otros problemas de validación
      this.handleExceptions(error);
    }
  }

  // Método para eliminar un Pokémon por su ID
  async remove(id: string) {
    // Intenta eliminar el documento y obtiene el conteo de documentos eliminados
    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id });

    // Si no se eliminó ningún documento, significa que no existía
    if (deletedCount === 0) {
      throw new BadRequestException(`Pokemon with id ${id} not found`);
    }

    // No retorna nada (void) si la eliminación fue exitosa
    return;
  }

  // Método privado para manejar excepciones de MongoDB de forma centralizada
  private handleExceptions(error: any) {
    // Error 11000: Violación de índice único (clave duplicada)
    // Este error ocurre cuando se intenta insertar un documento con un valor
    // que ya existe en un campo marcado como único (ej: nombre o número de Pokémon)
    if (error.code === 11000) {
      throw new BadRequestException(
        `Pokemon already exists: ${JSON.stringify(error.keyValue)}`,
      );
    }

    // Para cualquier otro error no manejado específicamente:
    // 1. Lo registra en los logs del servidor para debugging
    console.log(error);
    // 2. Lanza una excepción genérica 500 sin exponer detalles internos
    throw new InternalServerErrorException(
      `Can't create Pokemon - Check server logs`,
    );
  }
}
