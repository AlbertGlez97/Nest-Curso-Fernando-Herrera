import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductImage } from './';
import { User } from 'src/auth/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

// =========================================================================
// ENTIDAD PRODUCTO - DEFINICIÓN DE TABLA Y RELACIONES
// =========================================================================
// @Entity() le dice a TypeORM que esta clase representa una tabla en la BD
// Por defecto, el nombre de la tabla será 'product' (nombre de la clase en minúsculas)
@Entity({ name: 'products' })
export class Product {
  // =========================================================================
  // CLAVE PRIMARIA
  // =========================================================================
  // @PrimaryGeneratedColumn('uuid') crea una columna ID que:
  // - Es la clave primaria de la tabla
  // - Se genera automáticamente como UUID (ej: "550e8400-e29b-41d4-a716-446655440000")
  // - Los UUIDs son únicos globalmente, útiles para sistemas distribuidos
  // - Alternativa: 'increment' para IDs numéricos auto-incrementales
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // =========================================================================
  // COLUMNAS BÁSICAS DEL PRODUCTO
  // =========================================================================

  // TÍTULO DEL PRODUCTO:
  // @Column('text') especifica que es una columna de tipo TEXT en PostgreSQL
  // unique: true crea un índice único, no pueden existir dos productos con el mismo título
  @ApiProperty({
    example: 'T-Shirt Teslo',
    description: 'Product title',
    uniqueItems: true,
  })
  @Column('text', {
    unique: true,
  })
  title: string;

  // PRECIO DEL PRODUCTO:
  // 'float' permite números decimales (ej: 29.99)
  // default: 0 establece un valor por defecto si no se proporciona
  @ApiProperty({
    example: 0,
    description: 'Product price',
  })
  @Column('float', {
    default: 0,
  })
  price: number;

  // DESCRIPCIÓN DEL PRODUCTO:
  // nullable: true permite que este campo sea NULL en la base de datos
  // Es opcional, no todos los productos necesitan descripción
  @ApiProperty({
    example: 'Anim reprehenderit nulla in anim mollit minim irure commodo.',
    description: 'Product description',
    required: false,
  })
  @Column({
    type: 'text',
    nullable: true,
  })
  description: string;

  // SLUG PARA URL AMIGABLE:
  // El slug es una versión "limpia" del título para usar en URLs
  // Ej: "Camiseta Nike Básica" -> "camiseta-nike-basica"
  // unique: true asegura que cada slug sea único
  @ApiProperty({
    example: 't_shirt_teslo',
    description: 'Product SLUG - for SEO',
    uniqueItems: true,
  })
  @Column('text', {
    unique: true,
  })
  slug: string;

  // INVENTARIO DISPONIBLE:
  // 'int' para números enteros (no decimales)
  // default: 0 significa que por defecto no hay stock
  @ApiProperty({
    example: 10,
    description: 'Product stock',
    default: 0,
  })
  @Column('int', {
    default: 0,
  })
  stock: number;

  // TALLAS DISPONIBLES:
  // array: true crea una columna de tipo ARRAY en PostgreSQL
  // Almacena: ['S', 'M', 'L', 'XL'] directamente en la base de datos
  // PostgreSQL soporta arrays nativamente, otros DBs podrían necesitar serialización JSON
  @ApiProperty({
    example: ['M', 'XL', 'XXL'],
    description: 'Product sizes',
  })
  @Column('text', {
    array: true,
  })
  sizes: string[];

  // GÉNERO OBJETIVO:
  // Campo simple de texto para categorizar productos
  // Valores típicos: 'men', 'women', 'kid', 'unisex'
  @ApiProperty({
    example: 'women',
    description: 'Product gender',
  })
  @Column('text')
  gender: string;

  // ETIQUETAS PARA FILTROS:
  // Similar a sizes, usa array de PostgreSQL
  // default: [] asegura que siempre sea un array, nunca null
  // Útil para filtros: ['nike', 'deportivo', 'algodón']
  @ApiProperty({
    example: ['shirt', 'women'],
    description: 'Product tags',
    default: [],
  })
  @Column({
    type: 'text',
    array: true,
    default: [],
  })
  tags: string[];

  // =========================================================================
  // RELACIÓN CON IMÁGENES - @OneToMany
  // =========================================================================
  // @OneToMany establece una relación 1:N (Un producto puede tener muchas imágenes)
  //
  // PARÁMETROS EXPLICADOS:
  // 1. () => ProductImage: Función que retorna la entidad relacionada
  //    Se usa función para evitar problemas de dependencias circulares
  //
  // 2. (productImage) => productImage.product: Define el "lado inverso" de la relación
  //    Le dice a TypeORM cuál propiedad en ProductImage apunta de vuelta a Product
  //
  // 3. cascade: true - PROPAGACIÓN DE OPERACIONES:
  //    - Cuando GUARDES un Product, automáticamente guarda sus imágenes nuevas
  //    - Cuando ELIMINES un Product, automáticamente elimina sus imágenes
  //    - Sin cascade, tendrías que guardar/eliminar manualmente cada imagen
  //
  // 4. eager: true - CARGA AUTOMÁTICA:
  //    - Siempre que busques un Product, automáticamente incluye sus imágenes
  //    - Equivale a hacer LEFT JOIN en cada consulta
  //    - Sin eager, tendrías que especificar manualmente { relations: ['images'] }
  //
  // ESTRUCTURA RESULTANTE EN BD:
  // product tabla: id, title, price, description, etc.
  // product_image tabla: id, url, productId (foreign key)
  //
  // ¿Por qué images?: El signo ? indica que es opcional
  // Un producto puede existir sin imágenes durante la creación
  @ApiProperty({
    example: [
      { id: 1, url: 'http://localhost:3000/api/files/product/1234.jpg' },
    ],
    description: 'Product images',
  })
  @OneToMany(() => ProductImage, (productImage) => productImage.product, {
    cascade: true, // Guardar/eliminar imágenes automáticamente con el producto
    eager: true, // Cargar imágenes automáticamente en cada consulta
  })
  images?: ProductImage[];

  @ApiProperty({
    type: () => User,
    description: 'User who created the product',
  })
  @ManyToOne(() => User, (user) => user.product, { eager: true })
  user: User;

  // =========================================================================
  // HOOKS DE CICLO DE VIDA - PROCESAMIENTO AUTOMÁTICO DE DATOS
  // =========================================================================

  // @BeforeInsert se ejecuta ANTES de guardar un nuevo registro
  // Útil para procesar o validar datos antes de la primera inserción
  @BeforeInsert()
  checkSlugInsert() {
    // GENERACIÓN AUTOMÁTICA DE SLUG:
    // Si no se proporciona slug, usar el título como base
    if (!this.slug) this.slug = this.title;

    // NORMALIZACIÓN DEL SLUG:
    // Convertir a formato amigable para URLs
    this.slug = this.slug
      .toLocaleLowerCase() // "CAMISETA" -> "camiseta"
      .replaceAll(' ', '_') // "camiseta nike" -> "camiseta_nike"
      .replaceAll("'", ''); // "men's shirt" -> "mens shirt"
  }

  // @BeforeUpdate se ejecuta ANTES de actualizar un registro existente
  // Similar a BeforeInsert pero para actualizaciones
  @BeforeUpdate()
  checkSlugUpdate() {
    // MISMA NORMALIZACIÓN que en insert:
    // Asegura consistencia en el formato del slug
    this.slug = this.slug
      .toLocaleLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }
}
