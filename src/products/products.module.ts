import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product, ProductImage } from './entities';
import { ConfigModule } from '@nestjs/config';

// =========================================================================
// MÓDULO DE PRODUCTOS - CONFIGURACIÓN PARA EXPORTAR SERVICIOS
// =========================================================================
@Module({
  // CONTROLADORES: Manejan las peticiones HTTP y rutas
  controllers: [ProductsController],

  // PROVEEDORES: Servicios que este módulo puede usar internamente
  // ProductsService está disponible para inyección dentro de este módulo
  providers: [ProductsService],

  // IMPORTACIONES: Otros módulos que este módulo necesita
  imports: [
    // TypeOrmModule.forFeature() registra las entidades Product y ProductImage
    // para que puedan ser inyectadas como repositorios en los servicios
    TypeOrmModule.forFeature([Product, ProductImage]),

    // ConfigModule: Permite acceder a variables de entorno (.env)
    // Necesario para obtener HOST_API en ProductsService
    ConfigModule,
  ],

  // =========================================================================
  // EXPORTACIONES - CLAVE PARA USAR SERVICIOS EN OTROS MÓDULOS
  // =========================================================================
  // IMPORTANTE: exports hace que ProductsService esté disponible para
  // cualquier módulo que importe ProductsModule
  //
  // Sin esta línea:
  // ❌ SeedModule no podría inyectar ProductsService
  // ❌ Obtendríamos error: "Nest can't resolve dependencies"
  //
  // Con esta línea:
  // ✅ SeedModule puede importar ProductsModule
  // ✅ SeedModule puede inyectar ProductsService en sus servicios
  // ✅ SeedModule puede usar métodos como deleteAllProducts()
  //
  // EXPORTACIONES MÚLTIPLES:
  // - ProductsService: Para que otros módulos puedan usar la lógica de productos
  // - TypeOrmModule: Para que otros módulos puedan acceder a los repositorios
  //   de Product y ProductImage si necesitan hacer operaciones de BD directas
  //
  // REGLA GENERAL:
  // - providers = "Lo que este módulo puede usar"
  // - exports = "Lo que este módulo comparte con otros"
  exports: [ProductsService, TypeOrmModule]
})
export class ProductsModule {}
