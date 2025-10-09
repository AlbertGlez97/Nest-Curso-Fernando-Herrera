# Base de Datos y TypeORM

## ¿Qué es un ORM?

Un **ORM (Object-Relational Mapping)** es una herramienta que actúa como puente entre el código orientado a objetos y las bases de datos relacionales. En lugar de escribir SQL directamente, puedes trabajar con objetos y métodos de JavaScript/TypeScript.

### Ejemplo Práctico
```typescript
// ❌ Sin ORM - SQL Directo
const result = await db.query('SELECT * FROM users WHERE id = 1');

// ✅ Con ORM - Métodos de Objetos
const user = await User.findOne({ where: { id: 1 } });
```

## TypeORM

**TypeORM** es el ORM más popular para TypeScript/JavaScript que permite:
- Crear modelos (entidades) que representan tablas
- Realizar operaciones CRUD sin escribir SQL
- Mantener relaciones entre tablas de forma sencilla
- Generar migraciones automáticamente

### Instalación

```bash
yarn add @nestjs/typeorm typeorm pg
```

**Paquetes:**
- `@nestjs/typeorm`: Integración de TypeORM con NestJS
- `typeorm`: El ORM principal
- `pg`: Driver para PostgreSQL

## Configuración en NestJS

### app.module.ts

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',              // Tipo de base de datos
  host: process.env.DB_HOST,     // localhost
  port: +process.env.DB_PORT!,   // 5432
  username: process.env.DB_USER, // postgres
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, // TesloDB
  autoLoadEntities: true,        // Carga automática de entidades
  synchronize: true,             // ⚠️ Solo desarrollo
})
```

### Detalles Importantes

- **`+process.env.DB_PORT!`**: El `+` convierte string a número, `!` indica que existe
- **`autoLoadEntities`**: Evita registrar manualmente cada entidad
- **`synchronize: true`**: ⚠️ **PELIGROSO en producción** - puede borrar datos. Usar migraciones

## Entidades

### Product Entity

```typescript
@Entity({ name: 'products' })
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

  @OneToMany(() => ProductImage, (image) => image.product, {
    cascade: true,
    eager: true,
  })
  images?: ProductImage[];
}
```

### Decoradores Principales

#### @Entity()
Define que la clase representa una tabla en la BD.

#### @PrimaryGeneratedColumn('uuid')
- Crea una clave primaria auto-generada
- `'uuid'`: Genera UUIDs únicos globalmente
- Alternativa: `'increment'` para IDs numéricos

#### @Column()
Define una columna en la tabla.

**Opciones comunes:**
- `type`: Tipo de dato SQL (`'text'`, `'int'`, `'float'`)
- `unique`: No permite valores duplicados
- `nullable`: Permite valores NULL
- `default`: Valor por defecto
- `array`: Para arrays de PostgreSQL

#### @OneToMany()
Relación uno a muchos (1:N).

**Parámetros:**
1. `() => ProductImage`: Entidad relacionada
2. `(image) => image.product`: Lado inverso de la relación
3. Opciones:
   - `cascade: true`: Guarda/elimina automáticamente
   - `eager: true`: Carga automáticamente en consultas

### ProductImage Entity

```typescript
@Entity({ name: 'product_images' })
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

#### @ManyToOne()
Relación muchos a uno (N:1).

**`onDelete: 'CASCADE'`**: Cuando se elimina un Product, se eliminan sus imágenes.

## Hooks de Ciclo de Vida

### @BeforeInsert
Se ejecuta **antes** de guardar un nuevo registro.

```typescript
@BeforeInsert()
checkSlugInsert() {
  if (!this.slug) this.slug = this.title;

  this.slug = this.slug
    .toLowerCase()
    .replaceAll(' ', '_')
    .replaceAll("'", '');
}
```

### @BeforeUpdate
Se ejecuta **antes** de actualizar un registro existente.

```typescript
@BeforeUpdate()
checkSlugUpdate() {
  this.slug = this.slug
    .toLowerCase()
    .replaceAll(' ', '_')
    .replaceAll("'", '');
}
```

## Repositorios

Para usar las entidades en servicios:

```typescript
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
  ) {}

  async findAll() {
    return await this.productRepository.find();
  }

  async create(createProductDto: CreateProductDto) {
    const product = this.productRepository.create(createProductDto);
    return await this.productRepository.save(product);
  }
}
```

## Operaciones Comunes

### Crear
```typescript
const product = this.productRepository.create(data);
await this.productRepository.save(product);
```

### Buscar Uno
```typescript
const product = await this.productRepository.findOne({
  where: { id }
});
```

### Buscar Todos con Paginación
```typescript
const products = await this.productRepository.find({
  take: 10,
  skip: 0
});
```

### Actualizar
```typescript
await this.productRepository.update(id, updateData);
```

### Eliminar
```typescript
await this.productRepository.delete(id);
```

### Con Relaciones
```typescript
const product = await this.productRepository.findOne({
  where: { id },
  relations: ['images']
});
```

## Arrays en PostgreSQL

PostgreSQL soporta arrays nativamente:

```typescript
// Definición
@Column('text', { array: true })
sizes: string[];

// Uso
sizes: ['S', 'M', 'L', 'XL']
```

**Ventaja**: No necesitas una tabla separada para listas simples.

## Migraciones (Producción)

⚠️ En producción, **NO usar `synchronize: true`**

```bash
# Generar migración
yarn typeorm migration:generate -n MigrationName

# Ejecutar migraciones
yarn typeorm migration:run

# Revertir migración
yarn typeorm migration:revert
```
