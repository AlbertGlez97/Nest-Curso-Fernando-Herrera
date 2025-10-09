import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '.';

// =========================================================================
// ENTIDAD IMAGEN DE PRODUCTO - TABLA PARA ALMACENAR URLS DE IMÁGENES
// =========================================================================
// Esta entidad maneja la relación N:1 con Product
// Múltiples imágenes pueden pertenecer a un solo producto
@Entity({name: 'product_images'})
export class ProductImage {

  // =========================================================================
  // CLAVE PRIMARIA NUMÉRICA
  // =========================================================================
  // @PrimaryGeneratedColumn() sin parámetros crea un ID auto-incremental
  // Diferente a Product que usa UUID, aquí usamos números: 1, 2, 3, 4...
  // Los números son más eficientes para tablas con muchos registros
  // y cuando no necesitas unicidad global
  @PrimaryGeneratedColumn()
  id: number;

  // =========================================================================
  // URL DE LA IMAGEN
  // =========================================================================
  // Almacena la ruta o URL completa de la imagen
  // Ejemplos:
  // - "/uploads/productos/camiseta-nike-1.jpg"
  // - "https://cdn.tienda.com/images/producto123.png"
  // - "https://s3.amazonaws.com/bucket/imagen.webp"
  @Column('text')
  url: string;

  // =========================================================================
  // RELACIÓN CON PRODUCTO - @ManyToOne
  // =========================================================================
  // @ManyToOne establece relación N:1 (Muchas imágenes pertenecen a Un producto)
  //
  // PARÁMETROS EXPLICADOS:
  // 1. () => Product: Función que retorna la entidad padre (Product)
  //    Se usa función para evitar dependencias circulares entre archivos
  //
  // 2. (product) => product.images: Define el "lado inverso" de la relación
  //    Le dice a TypeORM que esta relación corresponde a la propiedad 'images' en Product
  //    Esto conecta ambos lados: Product.images <-> ProductImage.product
  //
  // 3. onDelete: 'CASCADE' - ELIMINACIÓN EN CASCADA:
  //    - Si eliminas un Product, automáticamente elimina TODAS sus imágenes
  //    - Sin CASCADE, tendrías que eliminar manualmente las imágenes primero
  //    - Evita "imágenes huérfanas" (imágenes sin producto asociado)
  //
  // ESTRUCTURA EN BASE DE DATOS:
  // La tabla product_image tendrá una columna 'productId' (foreign key)
  // que apunta al 'id' de la tabla product
  //
  // EJEMPLO DE DATOS:
  // Producto: { id: "abc-123", title: "Camiseta Nike" }
  // Imágenes:
  // - { id: 1, url: "camiseta1.jpg", productId: "abc-123" }
  // - { id: 2, url: "camiseta2.jpg", productId: "abc-123" }
  // - { id: 3, url: "camiseta3.jpg", productId: "abc-123" }
  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',    // Eliminar imágenes cuando se elimine el producto
  })
  product: Product;
}
