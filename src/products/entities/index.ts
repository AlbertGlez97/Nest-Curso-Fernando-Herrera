// =========================================================================
// BARREL EXPORTS - ARCHIVO ÍNDICE PARA ENTIDADES
// =========================================================================
// Este archivo centraliza las exportaciones de todas las entidades del módulo Product
// Permite importar múltiples entidades desde un solo lugar:
//
// En lugar de:
// import { Product } from './entities/product.entity';
// import { ProductImage } from './entities/product-image.entity';
//
// Puedes usar:
// import { Product, ProductImage } from './entities';
//
// Esto hace el código más limpio y fácil de mantener

export { Product } from './product.entity';
export { ProductImage } from './product-image.entity';
