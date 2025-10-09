import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';

// =========================================================================
// SERVICIO SEED - DEMOSTRACIÓN DE CÓMO USAR SERVICIOS DE OTROS MÓDULOS
// =========================================================================
@Injectable()
export class SeedService {

  // =========================================================================
  // INYECCIÓN DE DEPENDENCIAS DE OTRO MÓDULO
  // =========================================================================
  constructor(
    // IMPORTANTE: Para que esto funcione, necesitamos:
    //
    // 1. En ProductsModule (src/products/products.module.ts):
    //    @Module({
    //      providers: [ProductsService],    ← Declarar el servicio
    //      exports: [ProductsService]       ← EXPORTAR el servicio para otros módulos
    //    })
    //
    // 2. En SeedModule (src/seed/seed.module.ts):
    //    @Module({
    //      imports: [ProductsModule],       ← IMPORTAR el módulo completo (NO el servicio)
    //      providers: [SeedService]
    //    })
    //
    // 3. Una vez configurado correctamente, NestJS automáticamente:
    //    - Encuentra ProductsService en el módulo importado
    //    - Lo inyecta en este constructor
    //    - Permite usar todos sus métodos públicos
    private readonly productsService: ProductsService,
  ){}

  // =========================================================================
  // MÉTODO PRINCIPAL DEL SEED
  // =========================================================================
  async runSeed(){
    // Llamamos al método privado que maneja la lógica de inserción
    await this.insertNewProducts();

    return 'SEED EXECUTED'
  }

  // =========================================================================
  // USO DE MÉTODO EXPORTADO DE OTRO MÓDULO - INSERCIÓN MASIVA DE PRODUCTOS
  // =========================================================================
  private async insertNewProducts() {
    // PASO 1: LIMPIAR BASE DE DATOS
    // Ejemplo de cómo usar un método de otro servicio:
    // 1. El método deleteAllProducts() está definido en ProductsService
    // 2. ProductsService está EXPORTADO por ProductsModule
    // 3. ProductsModule está IMPORTADO en SeedModule
    // 4. ProductsService está INYECTADO en este constructor
    // 5. Por lo tanto, podemos llamar cualquier método público de ProductsService
    await this.productsService.deleteAllProducts();

    // PASO 2: OBTENER DATOS SEED
    // initialData proviene del archivo seed-data.ts que contiene productos predefinidos
    // Esta data incluye productos de Tesla con toda la información necesaria:
    // title, description, price, stock, sizes, images, etc.
    const products = initialData.products;

    // PASO 3: INSERCIÓN PARALELA CON PROMISE.ALLSETTLED()
    //
    // PATRÓN DE INSERCIÓN MASIVA OPTIMIZADA:
    // En lugar de usar un bucle secuencial (for/await), usamos Promise.allSettled()
    // para ejecutar todas las inserciones en paralelo, lo que es mucho más rápido.
    //
    // ❌ FORMA LENTA (secuencial):
    // for (const product of products) {
    //   await this.productsService.create(product);  // Una por una
    // }
    //
    // ✅ FORMA RÁPIDA (paralela):
    const insertPromises: Promise<any>[] = [];

    // CREAR ARRAY DE PROMESAS:
    // Por cada producto, creamos una promesa que llama al método create()
    // pero NO la ejecutamos todavía (no hay await aquí)
    products.forEach( product => {
      insertPromises.push(this.productsService.create(product));
    });

    // EJECUTAR TODAS LAS PROMESAS EN PARALELO:
    // Promise.allSettled() espera a que TODAS las promesas terminen
    // (exitosas o fallidas) antes de continuar.
    //
    // DIFERENCIAS CON Promise.all():
    // - Promise.all(): Si UNA falla, TODO falla
    // - Promise.allSettled(): Espera a todas, exitosas y fallidas
    //
    // Usamos allSettled() porque si un producto tiene errores de validación,
    // no queremos que cancele la inserción de los demás productos válidos.
    await Promise.allSettled(insertPromises);

    return true;
  }
}
