# TypeORM y Base de Datos

## ¿Qué es un ORM?

Un ORM (Object-Relational Mapping) es una herramienta que actúa como puente entre el código orientado a objetos y las bases de datos relacionales. En lugar de escribir SQL directamente, puedes trabajar con objetos y métodos de JavaScript/TypeScript.

**Ejemplo práctico:**
- Sin ORM: `SELECT * FROM users WHERE id = 1`
- Con ORM: `User.findOne({ where: { id: 1 } })`

**TypeORM** es el ORM más popular para TypeScript/JavaScript que permite:
- Crear modelos (entidades) que representan tablas
- Realizar operaciones CRUD sin escribir SQL
- Mantener relaciones entre tablas de forma sencilla
- Generar migraciones automáticamente

## Instalación

```bash
yarn add @nestjs/typeorm typeorm pg
```

- `@nestjs/typeorm`: Integración de TypeORM con NestJS
- `typeorm`: El ORM principal
- `pg`: Driver para PostgreSQL

## Configuración en app.module.ts

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',              // Tipo de base de datos (postgres, mysql, sqlite, etc.)
  host: process.env.DB_HOST,     // Dirección del servidor (ej: localhost)
  port: +process.env.DB_PORT!,   // Puerto de conexión (ej: 5432 para PostgreSQL)
  username: process.env.DB_USER, // Usuario de la base de datos
  password: process.env.DB_PASSWORD, // Contraseña del usuario
  database: process.env.DB_NAME, // Nombre de la base de datos específica
  autoLoadEntities: true,        // Busca y carga automáticamente todas las entidades
  synchronize: true,             // Sincroniza automáticamente el esquema (solo desarrollo)
})
```

**Detalles importantes:**
- `+process.env.DB_PORT!`: El `+` convierte el string a número, `!` indica que sabemos que existe
- `autoLoadEntities`: Evita tener que registrar manualmente cada entidad en el módulo
- `synchronize: true`: **PELIGROSO en producción** - puede borrar datos. Usar migraciones en producción

## Entidades del Proyecto

### Product Entity

```typescript
@Entity({name: 'products'})
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { unique: true })
  title: string;

  @Column('float', { default: 0 })
  price: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('text', { unique: true })
  slug: string;

  @Column('int', { default: 0 })
  stock: number;

  @Column('text', { array: true })
  sizes: string[];

  @Column('text')
  gender: string;

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @OneToMany(() => ProductImage, (productImage) => productImage.product, {
    cascade: true,
    eager: true,
  })
  images?: ProductImage[];

  @BeforeInsert()
  checkSlugInsert() {
    if (!this.slug) this.slug = this.title;
    this.slug = this.slug
      .toLocaleLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }

  @BeforeUpdate()
  checkSlugUpdate() {
    this.slug = this.slug
      .toLocaleLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }
}
```

**Características:**
- UUID como clave primaria
- Campos únicos: `title` y `slug`
- Arrays nativos de PostgreSQL: `sizes` y `tags`
- Relación `@OneToMany` con ProductImage
- Hooks `@BeforeInsert` y `@BeforeUpdate` para generar slug automáticamente

### ProductImage Entity

```typescript
@Entity({name: 'product_images'})
export class ProductImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  url: string;

  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  product: Product;
}
```

**Características:**
- ID numérico auto-incremental
- Relación `@ManyToOne` con Product
- `onDelete: 'CASCADE'`: Elimina imágenes cuando se elimina el producto

## Relaciones entre Entidades

### @OneToMany (Product → ProductImage)

```typescript
@OneToMany(() => ProductImage, (productImage) => productImage.product, {
  cascade: true,    // Guardar/eliminar imágenes automáticamente
  eager: true,      // Cargar imágenes automáticamente en cada consulta
})
images?: ProductImage[];
```

- **cascade: true**: Operaciones en Product se propagan a imágenes
- **eager: true**: Incluye imágenes automáticamente en consultas

### @ManyToOne (ProductImage → Product)

```typescript
@ManyToOne(() => Product, (product) => product.images, {
  onDelete: 'CASCADE',
})
product: Product;
```

- **onDelete: 'CASCADE'**: Elimina imágenes si se elimina el producto padre

## Operaciones Comunes

### Crear Producto

```typescript
const product = this.productRepository.create({
  title: 'Producto',
  price: 100,
  images: images.map(img =>
    this.productImageRepository.create({ url: img })
  ),
});
await this.productRepository.save(product);
```

### Buscar con Relaciones

```typescript
const products = await this.productRepository.find({
  relations: { images: true },
  take: 10,
  skip: 0,
});
```

### Actualizar con Transacciones

```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  await queryRunner.manager.delete(ProductImage, { product: { id } });
  await queryRunner.manager.save(product);
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
} finally {
  await queryRunner.release();
}
```

## Conceptos Clave

### Cascade
Propaga operaciones del padre a los hijos:
- `cascade: true`: Guarda/actualiza/elimina relacionados automáticamente
- Sin cascade: Debes manejar manualmente

### Eager Loading
```typescript
eager: true  // Carga relaciones automáticamente
```
**Con eager**: `findOne()` incluye imágenes
**Sin eager**: Necesitas `{ relations: ['images'] }`

### Lazy Loading
```typescript
@ManyToOne(() => Product)
product: Promise<Product>;  // Lazy loading
```
Carga la relación solo cuando se accede

### Query Builder
Para consultas complejas:
```typescript
const product = await this.productRepository
  .createQueryBuilder('prod')
  .where('LOWER(title) = :title', { title: 'camiseta' })
  .leftJoinAndSelect('prod.images', 'images')
  .getOne();
```

### Transacciones
Garantizan atomicidad (todo o nada):
```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.startTransaction();
// Operaciones...
await queryRunner.commitTransaction(); // o rollbackTransaction()
```

## Mejores Prácticas

1. **Usar migraciones en producción** (no `synchronize: true`)
2. **Validar datos con DTOs** antes de guardar
3. **Usar transacciones** para operaciones múltiples
4. **Índices en campos de búsqueda** (unique automáticamente crea índice)
5. **Eager loading con cuidado** (puede afectar performance)
6. **Lazy loading para relaciones grandes**
7. **Query Builder para consultas complejas**
