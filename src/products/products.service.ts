import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';
import { title } from 'process';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRepository.create(createProductDto);
      await this.productRepository.save(product);
      return product;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    return this.productRepository.find({
      take: limit,
      skip: offset,
    });
  }

  async findOne(term: string): Promise<Product> {
    // Variable que puede ser Product o null (hasta que validemos)
    // Esto permite que TypeScript acepte el resultado de findOneBy() y getOne()
    let product: Product | null;

    // Estrategia 1: Si el término es un UUID válido, buscar por ID
    if (isUUID(term)) {
      // findOneBy() retorna Product | null
      // Busca directamente por el campo ID usando el repositorio
      product = await this.productRepository.findOneBy({ id: term });
    }
    // Estrategia 2: Si no es UUID, asumir que es título o slug
    else {
      // QueryBuilder permite construir consultas SQL más complejas y personalizadas
      // Es necesario aquí porque necesitamos:
      // 1. Búsqueda case-insensitive (LOWER)
      // 2. Búsqueda en múltiples campos (OR)
      const queryBuilder = this.productRepository.createQueryBuilder();

      // getOne() también retorna Product | null
      product = await queryBuilder
        // WHERE con condición OR para buscar en dos campos simultáneamente
        // LOWER() convierte ambos lados de la comparación a minúsculas
        // Esto asegura que 'PRODUCTO', 'producto' y 'PrOdUcTo' sean equivalentes
        .where('LOWER(title) = :title OR LOWER(product.slug) = :slug', {
          title: term.toLowerCase(), // Parámetro :title
          slug: term.toLowerCase(), // Parámetro :slug
        })
        // getOne() retorna un único resultado o null
        // Si hay múltiples coincidencias, retorna solo la primera
        .getOne();
    }

    // Validación: Si no se encontró el producto, lanzar excepción
    // Esto convierte un null en un error HTTP 404 en NestJS
    if (!product) {
      throw new NotFoundException(`Product with term "${term}" not found`);
    }

    // En este punto, TypeScript sabe que product NO es null
    // gracias al guard de arriba, por lo que es seguro retornarlo como Product
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    // preload() es un método especial de TypeORM que:
    // 1. Busca en la base de datos una entidad con el ID proporcionado
    // 2. Si la encuentra, carga todos sus datos actuales
    // 3. Combina (merge) los datos existentes con los nuevos campos del DTO
    // 4. Retorna la entidad preparada para guardarse (pero aún NO la guarda)
    // 5. Si NO la encuentra, retorna undefined (no null)
    //
    // El spread operator (...updateProductDto) desempaqueta todas las propiedades
    // del DTO y las fusiona con el objeto. Por ejemplo:
    // Si updateProductDto = { title: 'Nuevo', price: 100 }
    // Se convierte en: { id: id, title: 'Nuevo', price: 100 }
    const product = await this.productRepository.preload({
      id: id, // ID del producto a buscar y actualizar
      ...updateProductDto, // Campos nuevos que sobrescribirán los existentes
    });

    // Validación: Si preload() retornó undefined, significa que no existe
    // un producto con ese ID en la base de datos
    if (!product) {
      // Lanzamos una excepción 404 Not Found
      // En NestJS, esto se traduce automáticamente en una respuesta HTTP 404
      throw new NotFoundException(`Product with id: ${id} not found`);
    }

    try {
      // save() persiste la entidad en la base de datos
      //
      // Detalles importantes de save():
      // - Si la entidad tiene ID y ya existe, hace UPDATE
      // - Si la entidad no tiene ID o no existe, hace INSERT
      // - En este caso, como viene de preload(), siempre es UPDATE
      // - Ejecuta validaciones de class-validator del DTO
      // - Ejecuta hooks de TypeORM (@BeforeUpdate, @AfterUpdate, etc.)
      // - Retorna la entidad guardada con los cambios aplicados
      // - Los cambios se confirman en la transacción de la base de datos
      await this.productRepository.save(product);

      // Retornamos el producto actualizado
      // Este producto ya contiene todos los cambios persistidos en la BD
      return product;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  remove(id: string) {
    return this.productRepository.delete({ id });
  }

  private handleDBExceptions(error: any) {
    if (error.code == '23505') throw new BadRequestException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException(
      'Únexpected error, check server logs',
    );
  }
}
