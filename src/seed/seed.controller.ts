import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SeedService } from './seed.service';
import { initialData } from './data/seed-data';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interfaces';

// =========================================================================
// CONTROLADOR SEED - DOCUMENTACIÓN CON SWAGGER
// =========================================================================
@ApiTags('Seed')
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  // =========================================================================
  // ENDPOINT PARA EJECUTAR SEED DE DATOS
  // =========================================================================
  @Get()
  @ApiOperation({
    summary: 'Ejecutar seed de la base de datos',
    description: `
    **Ejecuta el proceso de seed de la base de datos**

    Este endpoint:
    - ⚠️  **ELIMINA TODOS** los productos existentes en la base de datos
    - 📦 **INSERTA** productos predefinidos desde seed-data.ts
    - 🚀 **OPTIMIZADO** con inserción paralela usando Promise.allSettled()

    **⚠️ ADVERTENCIA:**
    Este endpoint es **DESTRUCTIVO** y eliminará todos los datos de productos.
    Solo debe usarse en **desarrollo** o para resetear la base de datos.

    **Datos insertados:**
    - ${initialData.products.length} productos de Tesla
    - Incluye camisetas, hoodies, gorros y productos para niños
    - Cada producto tiene imágenes, precios, stock y variantes de tallas

    **Proceso ejecutado:**
    1. Elimina todos los productos existentes
    2. Inserta productos predefinidos en paralelo
    3. Retorna confirmación de ejecución exitosa
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Seed ejecutado correctamente',
    schema: {
      type: 'string',
      example: 'SEED EXECUTED',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor durante la ejecución del seed',
  })
  // @Auth(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
  executeSeed() {
    return this.seedService.runSeed();
  }
}
