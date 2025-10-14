import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { ProductsModule } from 'src/products/products.module';
import { AuthModule } from 'src/auth/auth.module';

// =========================================================================
// MÓDULO SEED - DEMOSTRACIÓN DE IMPORTACIÓN DE SERVICIOS DE OTROS MÓDULOS
// =========================================================================
@Module({
  // CONTROLADORES: Exponen endpoints HTTP para este módulo
  controllers: [SeedController],

  // PROVEEDORES: Servicios que pertenecen a este módulo
  providers: [SeedService],

  // =========================================================================
  // IMPORTACIONES - CÓMO USAR SERVICIOS DE OTROS MÓDULOS
  // =========================================================================
  // IMPORTANTE: imports recibe MÓDULOS, no servicios individuales
  //
  // ❌ INCORRECTO (lo que causaba el error original):
  // imports: [ProductsService]  ← Esto está MAL
  //
  // ✅ CORRECTO:
  // imports: [ProductsModule]   ← Esto está BIEN
  //
  // ¿Por qué funciona?
  // 1. ProductsModule declara ProductsService en providers
  // 2. ProductsModule EXPORTA ProductsService en exports
  // 3. Al importar ProductsModule, automáticamente tenemos acceso a ProductsService
  // 4. Podemos inyectar ProductsService en cualquier servicio de SeedModule
  //
  // FLUJO COMPLETO:
  // ProductsModule.exports → [ProductsService]
  //        ↓
  // SeedModule.imports → [ProductsModule]
  //        ↓
  // SeedService.constructor → (ProductsService inyectado automáticamente)
  //        ↓
  // SeedService puede usar → this.productsService.deleteAllProducts()
  imports: [ProductsModule, AuthModule],
})
export class SeedModule {}
