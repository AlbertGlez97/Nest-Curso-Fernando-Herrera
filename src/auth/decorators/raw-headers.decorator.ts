import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

// =========================================================================
// DECORADOR PERSONALIZADO: @RawHeaders()
// =========================================================================
// Decorador que extrae los headers HTTP de la petición
//
// =========================================================================
// CONCEPTOS CLAVE
// =========================================================================
//
// 1. HEADERS HTTP:
//    - Son metadatos que acompañan cada petición HTTP
//    - Formato: "nombre: valor" (ej: "Content-Type: application/json")
//    - Categorías comunes:
//      * General: date, connection, cache-control
//      * Request: host, user-agent, accept, authorization
//      * Response: server, set-cookie, location
//      * Entity: content-type, content-length, content-encoding
//
// 2. req.headers vs req.rawHeaders:
//    - req.headers: Objeto con pares clave-valor normalizados
//      Ejemplo: { 'content-type': 'application/json', 'host': 'localhost' }
//    - req.rawHeaders: Array con headers en formato alternado
//      Ejemplo: ['Content-Type', 'application/json', 'Host', 'localhost']
//    - rawHeaders preserva el case original de los nombres
//
// 3. USOS COMUNES:
//    - Logging y auditoría de peticiones
//    - Debugging de problemas de cliente
//    - Validación de headers personalizados
//    - Extracción de información del cliente (user-agent, IP, etc.)
//
// =========================================================================
// USO DEL DECORADOR:
// =========================================================================
//
// CASO 1: Obtener todos los headers (objeto normalizado)
// @Get('info')
// getInfo(@RawHeaders() headers: any) {
//   // headers = { 'host': 'localhost:3000', 'authorization': 'Bearer ...', ... }
//   return { headers };
// }
//
// CASO 2: Obtener un header específico
// @Get('token')
// getToken(@RawHeaders('authorization') auth: string) {
//   // auth = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
//   return { auth };
// }
//
// CASO 3: Uso para logging
// @Post('create')
// createItem(
//   @Body() data: any,
//   @RawHeaders('user-agent') userAgent: string
// ) {
//   this.logger.log(`Request from: ${userAgent}`);
//   return this.service.create(data);
// }
//
// =========================================================================
// ALTERNATIVAS EN NESTJS:
// =========================================================================
//
// OPCIÓN 1: @Headers() (decorador nativo de NestJS)
// @Get('info')
// getInfo(@Headers() headers: any) {
//   return { headers };
// }
//
// OPCIÓN 2: @Headers('nombre') (header específico)
// @Get('token')
// getToken(@Headers('authorization') auth: string) {
//   return { auth };
// }
//
// OPCIÓN 3: @Req() (acceso al request completo)
// @Get('info')
// getInfo(@Req() req: Request) {
//   const headers = req.headers;
//   return { headers };
// }
//
// ¿POR QUÉ CREAR UN DECORADOR PERSONALIZADO?
// - Práctica educativa para entender createParamDecorator
// - Puede agregar lógica personalizada (sanitización, validación)
// - En producción, @Headers() es suficiente para la mayoría de casos
//
// =========================================================================

// createParamDecorator:
// Función de NestJS que crea un decorador de parámetro personalizado
//
// PARÁMETROS:
// - data: El nombre del header a extraer (ej: 'authorization' en @RawHeaders('authorization'))
//        Si es undefined, se retornan todos los headers
// - ctx: ExecutionContext - Contexto de ejecución de NestJS
//
// RETORNA:
// - Todos los headers (objeto) si data es undefined
// - Un header específico (string) si data tiene un nombre
export const RawHeaders = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    // PASO 1: CAMBIAR AL CONTEXTO HTTP Y OBTENER REQUEST
    // ctx.switchToHttp() convierte el contexto genérico a contexto HTTP
    // getRequest() obtiene el objeto request de Express
    const req = ctx.switchToHttp().getRequest();

    // PASO 2: EXTRAER LOS HEADERS DEL REQUEST
    // req.headers es un objeto con todos los headers HTTP
    // Los nombres de los headers están normalizados a minúsculas
    //
    // ESTRUCTURA DE req.headers:
    // {
    //   'host': 'localhost:3000',
    //   'connection': 'keep-alive',
    //   'content-type': 'application/json',
    //   'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    //   'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...',
    //   'accept': '*/*',
    //   'accept-encoding': 'gzip, deflate',
    //   'accept-language': 'es-ES,es;q=0.9,en;q=0.8'
    // }
    //
    // NOTA IMPORTANTE:
    // A pesar del nombre "RawHeaders", este decorador usa req.headers
    // (normalizado) y NO req.rawHeaders (array sin normalizar)
    //
    // Si necesitas el formato rawHeaders (array), cambiar a:
    // const headers = req.rawHeaders;
    // Ejemplo de rawHeaders:
    // ['Host', 'localhost:3000', 'Connection', 'keep-alive', ...]
    const headers = req.headers;

    // PASO 3: VALIDAR QUE LOS HEADERS EXISTAN
    // En Express, req.headers siempre existe (como mínimo es {})
    // Esta validación es defensiva por si usas otro framework
    //
    // CASOS EN QUE PODRÍA SER undefined:
    // 1. Usando un framework diferente a Express
    // 2. Middleware personalizado que elimina req.headers (muy raro)
    // 3. Error en la configuración de NestJS
    //
    // IMPORTANTE:
    // Este error NUNCA debería ocurrir en una aplicación normal
    // Es una validación de seguridad
    if (!headers) {
      throw new InternalServerErrorException('Headers not found in request');
    }

    // PASO 4: RETORNAR TODOS LOS HEADERS O UNO ESPECÍFICO
    //
    // CASO 1: @RawHeaders() - Sin argumentos
    // data es undefined, retornamos todos los headers
    // Ejemplo:
    // @RawHeaders() headers: any
    // → Recibe: { 'host': 'localhost', 'authorization': 'Bearer ...', ... }
    //
    // CASO 2: @RawHeaders('authorization') - Con argumento
    // data es 'authorization', retornamos solo ese header
    // Ejemplo:
    // @RawHeaders('authorization') auth: string
    // → Recibe: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    //
    // ACCESO DINÁMICO A HEADERS:
    // headers[data] es equivalente a:
    // - headers['authorization'] → headers.authorization
    // - headers['user-agent'] → headers['user-agent']
    // - headers['content-type'] → headers['content-type']
    //
    // IMPORTANTE - NORMALIZACIÓN:
    // Los nombres de headers en req.headers están en minúsculas
    // Por lo tanto:
    // - @RawHeaders('Authorization') → busca 'authorization'
    // - @RawHeaders('User-Agent') → busca 'user-agent'
    // - @RawHeaders('Content-Type') → busca 'content-type'
    //
    // EJEMPLO PRÁCTICO:
    // Cliente envía: "Authorization: Bearer token123"
    // req.headers = { 'authorization': 'Bearer token123' }
    // @RawHeaders('authorization') → "Bearer token123"
    // @RawHeaders('Authorization') → "Bearer token123" (también funciona)
    if (data) {
      return headers[data];
    }

    // Retornar todos los headers si no se especificó un nombre
    return headers;
  },
);
