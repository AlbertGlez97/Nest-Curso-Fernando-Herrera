import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';
import { Product, ProductImage } from './entities';
import { DataSource } from 'typeorm';
import { handleDBExceptions } from 'src/common/helpers/handleDBExceptions.helper';
import { User } from 'src/auth/entities/user.entity';

// =========================================================================
// SERVICIO DE PRODUCTOS - LÓGICA DE NEGOCIO
// =========================================================================
@Injectable()
export class ProductsService {
  // LOGGER para registrar errores y eventos importantes
  private readonly logger = new Logger('ProductsService');

  // INYECCIÓN DE DEPENDENCIAS:
  constructor(
    // Repositorio para la entidad Product (operaciones CRUD básicas)
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    // Repositorio para la entidad ProductImage (manejo de imágenes)
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    // DataSource para operaciones avanzadas como transacciones
    private readonly dataSource: DataSource,

    // ConfigService para acceder a variables de entorno (HOST_API)
    private readonly configService: ConfigService,
  ) {}

  // =========================================================================
  // CREAR NUEVO PRODUCTO
  // =========================================================================
  async create(createProductDto: CreateProductDto, user: User) {
    try {
      // DESESTRUCTURACIÓN del DTO:
      // - images: array de URLs de imágenes (si no se proporciona, defaultea a [])
      // - productDetails: resto de las propiedades (title, price, description, etc.)
      const { images = [], ...productDetails } = createProductDto;

      // CREAR LA ENTIDAD PRODUCTO en memoria (aún NO se guarda en BD)
      // this.productRepository.create() NO toca la base de datos, solo crea el objeto
      const product = this.productRepository.create({
        ...productDetails, // title, price, description, slug, stock, sizes, gender, tags

        // CREAR IMÁGENES RELACIONADAS:
        // Convertimos cada string URL en una entidad ProductImage
        // Esto aprovecha la relación @OneToMany definida en Product entity
        images: images.map((image) =>
          this.productImageRepository.create({ url: image }),
        ),
        user, // Asociar el producto al usuario que lo creó
      });

      // GUARDAR EN BASE DE DATOS:
      // Como tenemos cascade: true en la relación de Product -> ProductImage,
      // esto guarda automáticamente:
      // 1. El producto principal
      // 2. Todas sus imágenes relacionadas
      await this.productRepository.save(product);

      // RETORNAR RESPUESTA:
      // Combinamos los datos del producto guardado con las URLs de imágenes
      // para mantener un formato consistente en la respuesta de la API
      return { ...product, images };
    } catch (error) {
      // Si algo sale mal (ej: violación de constraints únicos),
      // delegamos el manejo a nuestro método especializado
      handleDBExceptions(error, this.logger);
    }
  }

  // =========================================================================
  // OBTENER TODOS LOS PRODUCTOS CON PAGINACIÓN
  // =========================================================================
  async findAll(paginationDto: PaginationDto) {
    // DESESTRUCTURACIÓN con valores por defecto:
    // Si no se proporciona limit, usa 10
    // Si no se proporciona offset, usa 0
    const { limit = 10, offset = 0 } = paginationDto;

    // CONSULTAR LA BASE DE DATOS:
    const products = await this.productRepository.find({
      take: limit, // LIMIT en SQL - cuántos registros máximo retornar
      skip: offset, // OFFSET en SQL - cuántos registros saltar desde el inicio

      // INCLUIR RELACIONES:
      // Esto hace un LEFT JOIN con la tabla ProductImage
      // Equivale a: SELECT * FROM product LEFT JOIN product_image ON...
      relations: {
        images: true, // Cargar automáticamente las imágenes de cada producto
      },
    });

    // FORMATEAR LA RESPUESTA:
    // Transformamos cada producto para incluir URLs completas de imágenes
    return products.map((product) => ({
      ...product, // Mantener todas las propiedades del producto

      // TRANSFORMAR IMÁGENES:
      // Convertir de: [{ id: 1, url: "img1.jpg" }, { id: 2, url: "img2.jpg" }]
      // A: ["http://localhost:50278/api/files/product/img1.jpg", "http://localhost:50278/api/files/product/img2.jpg"]
      // Por cada imagen, transformamos su URL usando el método privado
      images: product.images?.map((img) => this.transformImageUrl(img.url)),
    }));
  }

  // =========================================================================
  // BUSCAR UN PRODUCTO POR ID, TÍTULO O SLUG
  // =========================================================================
  async findOne(term: string): Promise<Product> {
    // TIPADO FLEXIBLE:
    // Variable que puede ser Product o null (hasta que validemos)
    // Esto permite que TypeScript acepte el resultado de findOneBy() y getOne()
    let product: Product | null;

    // ESTRATEGIA 1: BÚSQUEDA POR UUID
    // Si el término es un UUID válido, buscar directamente por ID
    if (isUUID(term)) {
      // findOneBy() es el método más simple para búsquedas por campo exacto
      // Retorna Product | null
      // Equivale a: SELECT * FROM product WHERE id = 'uuid-aquí'
      product = await this.productRepository.findOneBy({ id: term });
    }
    // ESTRATEGIA 2: BÚSQUEDA POR TÍTULO O SLUG
    // Si no es UUID, asumir que es título o slug y buscar en ambos campos
    else {
      // QUERY BUILDER para consultas complejas:
      // createQueryBuilder() permite construir consultas SQL personalizadas
      // Es necesario aquí porque necesitamos:
      // 1. Búsqueda case-insensitive (LOWER)
      // 2. Búsqueda en múltiples campos con OR
      // 3. Incluir relaciones (imágenes)
      const queryBuilder = this.productRepository.createQueryBuilder('prod');

      product = await queryBuilder
        // CONDICIÓN WHERE con OR:
        // Busca en title O slug, ambos convertidos a minúsculas
        // :title y :slug son parámetros que se pasan en el objeto siguiente
        .where('LOWER(title) = :title OR LOWER(slug) = :slug', {
          title: term.toLowerCase(), // Reemplaza :title
          slug: term.toLowerCase(), // Reemplaza :slug
        })
        // INCLUIR RELACIONES:
        // leftJoinAndSelect incluye las imágenes del producto en el resultado
        // 'prod.images' se refiere a la propiedad images de la entidad Product
        // 'prodImages' es el alias para la tabla ProductImage en esta consulta
        .leftJoinAndSelect('prod.images', 'prodImages')
        // EJECUTAR Y OBTENER RESULTADO:
        // getOne() retorna un único resultado o null
        // Si hay múltiples coincidencias, retorna solo la primera
        .getOne();
    }

    // VALIDACIÓN DE EXISTENCIA:
    // Si no se encontró el producto en ninguna estrategia, lanzar excepción
    // NotFoundException automáticamente retorna HTTP 404 en NestJS
    if (!product) {
      throw new NotFoundException(`Product with term "${term}" not found`);
    }

    // TYPE NARROWING:
    // En este punto, TypeScript sabe que product NO es null
    // gracias al guard de arriba, por lo que es seguro retornarlo
    return product;
  }

  // =========================================================================
  // BUSCAR UN PRODUCTO Y DEVOLVER FORMATO SIMPLIFICADO
  // =========================================================================
  async findOnePlain(term) {
    // REUTILIZAR LÓGICA EXISTENTE:
    // Llamamos a findOne() que ya maneja la búsqueda por UUID, título o slug
    // y incluye las imágenes relacionadas
    const { images = [], ...rest } = await this.findOne(term);

    // FORMATEAR RESPUESTA SIMPLIFICADA:
    // Transformamos el resultado para que sea más fácil de usar por el frontend
    return {
      ...rest, // Todas las propiedades del producto (id, title, price, etc.)

      // TRANSFORMAR Y SIMPLIFICAR IMÁGENES:
      // Convertir de: [{ id: 1, url: "img1.jpg", product: {...} }, ...]
      // A: ["http://localhost:50278/api/files/product/img1.jpg", "http://localhost:50278/api/files/product/img2.jpg", ...]
      // Por cada imagen, extraemos la URL y la transformamos a URL pública completa
      images: images.map((image) => this.transformImageUrl(image.url)),
    };
  }

  // =========================================================================
  // ACTUALIZAR PRODUCTO EXISTENTE
  // =========================================================================
  async update(id: string, updateProductDto: UpdateProductDto, user: User) {
    // SEPARAR IMÁGENES DEL RESTO DE DATOS:
    // images: array de nuevas URLs (si se proporciona)
    // toUpdate: resto de propiedades a actualizar (title, price, etc.)
    const { images, ...toUpdate } = updateProductDto;

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
      id, // ID del producto a buscar y actualizar
      ...toUpdate, // Campos nuevos que sobrescribirán los existentes
    });

    // Validación: Si preload() retornó undefined, significa que no existe
    // un producto con ese ID en la base de datos
    if (!product) {
      // Lanzamos una excepción 404 Not Found
      // En NestJS, esto se traduce automáticamente en una respuesta HTTP 404
      throw new NotFoundException(`Product with id: ${id} not found`);
    }

    // =========================================================================
    // MANEJO DE TRANSACCIONES CON QUERY RUNNER
    // =========================================================================
    //
    // Un QueryRunner es una herramienta de TypeORM que permite ejecutar múltiples
    // operaciones de base de datos dentro de una TRANSACCIÓN única.
    //
    // ¿Por qué es necesario aquí?
    // --------------------------------------
    // Cuando actualizamos un producto que tiene imágenes, necesitamos:
    // 1. ELIMINAR todas las imágenes antiguas del producto
    // 2. CREAR las nuevas imágenes
    // 3. GUARDAR el producto actualizado
    //
    // Esto son 3 operaciones que DEBEN ejecutarse juntas:
    // - Si falla cualquiera, TODAS deben deshacerse (rollback)
    // - Si todas funcionan, TODAS deben confirmarse (commit)
    //
    // Ejemplo de problema SIN transacciones:
    // 1. ✅ Eliminamos imágenes antiguas
    // 2. ❌ Falla la creación de nuevas imágenes
    // 3. 🚨 RESULTADO: ¡El producto queda SIN imágenes!
    //
    // Con transacciones:
    // 1. ✅ Eliminamos imágenes antiguas (en memoria temporal)
    // 2. ❌ Falla la creación de nuevas imágenes
    // 3. ✅ ROLLBACK: Todo vuelve al estado original
    //
    // Creamos el QueryRunner a partir del DataSource (conexión a la BD)
    const queryRunner = this.dataSource.createQueryRunner();

    // Establecemos la conexión con la base de datos
    // Esto es necesario antes de poder usar el queryRunner
    await queryRunner.connect();

    // INICIAMOS LA TRANSACCIÓN
    // A partir de aquí, todas las operaciones se ejecutan en memoria temporal
    // Nada se confirma en la BD hasta que hagamos commit()
    await queryRunner.startTransaction();

    try {
      // Lógica de actualización dentro de la transacción
      if (images) {
        // PASO 1: Eliminar todas las imágenes existentes del producto
        // queryRunner.manager actúa como un "repositorio temporal" dentro de la transacción
        // Esto NO afecta la BD real hasta que se haga commit
        await queryRunner.manager.delete(ProductImage, { product: { id } });

        // PASO 2: Crear las nuevas imágenes en memoria
        // Creamos las entidades pero aún no las guardamos en BD
        product.images = images.map((image) =>
          this.productImageRepository.create({ url: image }),
        );
      }

      product.user = user; // Actualizar el usuario que modificó el producto

      // PASO 3: Guardar el producto con sus nuevas imágenes
      // Como product.images está poblado arriba y tenemos cascade: true,
      // esto guarda automáticamente tanto el producto como sus imágenes
      await queryRunner.manager.save(product);

      // COMMIT: Si llegamos aquí, TODO salió bien
      // Confirmamos TODOS los cambios en la base de datos real
      await queryRunner.commitTransaction();

      // Liberamos los recursos del queryRunner
      await queryRunner.release();

      // Retornamos el producto actualizado desde la BD para confirmar los cambios
      return this.findOnePlain(id);
    } catch (error) {
      // ROLLBACK: Si algo falló, deshacemos TODOS los cambios
      // La BD queda exactamente como estaba antes de empezar
      await queryRunner.rollbackTransaction();

      // Liberamos los recursos incluso en caso de error
      await queryRunner.release();

      // Re-lanzamos el error para que el controlador pueda manejarlo
      handleDBExceptions(error, this.logger);
    }
  }

  // =========================================================================
  // ELIMINAR PRODUCTO POR ID
  // =========================================================================
  remove(id: string) {
    // ELIMINACIÓN SIMPLE:
    // delete() ejecuta un DELETE SQL directo sin cargar la entidad en memoria
    // Equivale a: DELETE FROM product WHERE id = 'uuid-aquí'
    //
    // NOTA: Gracias a la configuración onDelete: 'CASCADE' en ProductImage,
    // las imágenes relacionadas se eliminan automáticamente
    //
    // RETORNA: DeleteResult con información sobre cuántas filas se afectaron
    return this.productRepository.delete({ id });
  }

  // =========================================================================
  // TRANSFORMAR URL DE IMAGEN A URL PÚBLICA COMPLETA
  // =========================================================================
  /**
   * Transforma una URL de imagen a URL pública completa
   *
   * @param imageUrl - El nombre del archivo de imagen (ej: "a3f5c8d9-1234.jpeg")
   * @returns La URL pública completa de la imagen
   *
   * @example
   * const url = this.transformImageUrl("a3f5c8d9-1234.jpeg");
   * // Resultado: "http://localhost:50278/api/files/product/a3f5c8d9-1234.jpeg"
   */
  private transformImageUrl(imageUrl: string): string {
    // VALIDACIÓN: Si la URL ya está transformada (empieza con "http"), retornarla sin cambios
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    // OBTENER HOST_API desde variables de entorno
    const hostApi = this.configService.get<string>('HOST_API');

    // CONSTRUCCIÓN DE LA URL COMPLETA
    return `${hostApi}/files/product/${imageUrl}`;
  }

  // =========================================================================
  // ELIMINAR TODOS LOS PRODUCTOS (MÉTODO AUXILIAR)
  // =========================================================================
  async deleteAllProducts() {
    // CREAR QUERY BUILDER para eliminación masiva:
    // Crear un constructor de consultas SQL con alias 'product'
    const query = this.productRepository.createQueryBuilder('product');

    try {
      // EJECUTAR ELIMINACIÓN MASIVA:
      // .delete() prepara la consulta DELETE
      // .where({}) = sin condiciones WHERE (elimina TODOS los registros)
      // .execute() ejecuta la consulta y retorna información sobre cuántas filas se afectaron
      //
      // Equivale a: DELETE FROM product
      // ⚠️ PELIGROSO: Esto elimina TODOS los productos de la base de datos
      return await query.delete().where({}).execute();
    } catch (error) {
      // MANEJO DE ERRORES:
      // Usar nuestro método centralizado para manejar errores de BD
      handleDBExceptions(error, this.logger);
    }
  }
}
