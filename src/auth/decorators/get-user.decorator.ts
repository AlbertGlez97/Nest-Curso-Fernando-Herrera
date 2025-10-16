import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

// =========================================================================
// DECORADOR PERSONALIZADO: @GetUser()
// =========================================================================
// Decorador que extrae el usuario autenticado del request
//
// =========================================================================
// CONCEPTOS CLAVE
// =========================================================================
//
// 1. DECORADORES DE PARÁMETROS (createParamDecorator):
//    - Son decoradores que se aplican a parámetros de métodos en controladores
//    - Extraen información del contexto de ejecución (request, response, etc.)
//    - Equivalentes de NestJS: @Body(), @Param(), @Query(), @Headers(), @Req()
//    - Los personalizados permiten crear abstracciones reutilizables
//
// 2. ExecutionContext:
//    - Proporciona acceso al contexto de ejecución actual
//    - Métodos principales:
//      * switchToHttp() - Cambia a contexto HTTP
//      * switchToRpc() - Cambia a contexto RPC (microservicios)
//      * switchToWs() - Cambia a contexto WebSocket
//    - Una vez en el contexto correcto, se puede acceder a request y response
//
// 3. FLUJO DE AUTENTICACIÓN (ANTES de llegar a este decorador):
//    1. Cliente envía petición con JWT en header Authorization
//    2. @UseGuards(AuthGuard()) intercepta la petición
//    3. JwtStrategy valida el token y busca el usuario en BD
//    4. JwtStrategy retorna el usuario
//    5. Passport adjunta el usuario a req.user
//    6. El decorador @GetUser() extrae req.user
//    7. El handler recibe el usuario como parámetro
//
// 4. req.user:
//    - Es una propiedad estándar de Express/Passport
//    - Passport la crea automáticamente cuando se usa autenticación
//    - Contiene el usuario retornado por JwtStrategy.validate()
//    - Solo existe después de pasar por AuthGuard()
//
// =========================================================================
// USO DEL DECORADOR:
// =========================================================================
//
// CASO 1: Obtener usuario completo
// @Get('profile')
// @UseGuards(AuthGuard())
// getProfile(@GetUser() user: User) {
//   // user = { id, email, fullName, isActive, roles }
//   return { user };
// }
//
// CASO 2: Obtener solo una propiedad específica
// @Get('email')
// @UseGuards(AuthGuard())
// getEmail(@GetUser('email') email: string) {
//   // email = "user@example.com"
//   return { email };
// }
//
// CASO 3: Obtener múltiples propiedades
// @Get('info')
// @UseGuards(AuthGuard())
// getInfo(
//   @GetUser('id') id: string,
//   @GetUser('email') email: string
// ) {
//   return { id, email };
// }
//
// =========================================================================
// VENTAJAS SOBRE @Req():
// =========================================================================
//
// ANTES (sin decorador personalizado):
// @Get('profile')
// getProfile(@Req() req: Request) {
//   const user = req.user; // Necesitas importar tipo User
//   if (!user) throw new InternalServerErrorException('User not found');
//   return { user };
// }
//
// DESPUÉS (con @GetUser()):
// @Get('profile')
// getProfile(@GetUser() user: User) {
//   return { user };
// }
//
// VENTAJAS:
// 1. Código más limpio y expresivo
// 2. Type-safe: TypeScript sabe que es un User
// 3. Validación automática (lanza excepción si req.user no existe)
// 4. Reutilizable en todos los controladores
// 5. Fácil de testear (puedes mockear el decorador)
//
// =========================================================================

// createParamDecorator:
// Función de NestJS que crea un decorador de parámetro personalizado
//
// PARÁMETROS:
// - data: El argumento pasado al decorador (ej: 'email' en @GetUser('email'))
// - ctx: ExecutionContext - Contexto de ejecución de NestJS
//
// RETORNA:
// El valor que será inyectado en el parámetro del método
export const GetUser = createParamDecorator((data, ctx: ExecutionContext) => {
  // PASO 1: CAMBIAR AL CONTEXTO HTTP
  // ctx.switchToHttp() convierte el contexto genérico a contexto HTTP
  // Esto nos da acceso a request, response, next, etc.
  //
  // getRequest():
  // Obtiene el objeto request de Express
  // Es equivalente al parámetro @Req() en NestJS
  //
  // TIPO DEL REQUEST:
  // Request<ParamsDictionary, any, any, qs.ParsedQs, Record<string, any>>
  // Es el tipo de Express.Request con todas sus propiedades
  const req = ctx.switchToHttp().getRequest();

  // PASO 2: EXTRAER EL USUARIO DEL REQUEST
  // req.user fue adjuntado por Passport después de validar el JWT
  // Contiene el usuario completo retornado por JwtStrategy.validate()
  //
  // ESTRUCTURA DE req.user:
  // {
  //   id: "550e8400-e29b-41d4-a716-446655440000",
  //   email: "user@example.com",
  //   fullName: "Juan Pérez",
  //   isActive: true,
  //   roles: ["user"]
  // }
  //
  // NOTA: password NO está incluido porque en user.entity.ts
  // tiene la configuración { select: false }
  const user = req.user;

  // PASO 3: VALIDAR QUE EL USUARIO EXISTA
  // Si req.user es undefined, significa que:
  // 1. La ruta NO tiene @UseGuards(AuthGuard())
  // 2. Hay un error en la configuración de Passport
  // 3. JwtStrategy.validate() no retornó un usuario
  //
  // IMPORTANTE:
  // Este error NUNCA debería ocurrir si se usa correctamente @UseGuards(AuthGuard())
  // Es una validación de seguridad para detectar errores de configuración
  //
  // CÓDIGOS DE RESPUESTA:
  // - 500 Internal Server Error: Error de configuración
  //
  // MENSAJE PARA EL DESARROLLADOR:
  // "User not found in request" indica que olvidaste @UseGuards(AuthGuard())
  // o hay un problema en JwtStrategy
  if (!user) {
    throw new InternalServerErrorException('User not found in request');
  }

  // PASO 4: RETORNAR USUARIO COMPLETO O PROPIEDAD ESPECÍFICA
  //
  // CASO 1: @GetUser() - Sin argumentos
  // data es undefined, retornamos el usuario completo
  // Ejemplo:
  // @GetUser() user: User
  // → Recibe: { id: "...", email: "...", fullName: "...", ... }
  //
  // CASO 2: @GetUser('email') - Con argumento
  // data es 'email', retornamos solo esa propiedad
  // Ejemplo:
  // @GetUser('email') email: string
  // → Recibe: "user@example.com"
  //
  // ACCESO DINÁMICO A PROPIEDADES:
  // user[data] es equivalente a:
  // - user['email'] → user.email
  // - user['id'] → user.id
  // - user['roles'] → user.roles
  //
  // VENTAJA:
  // Evita crear múltiples decoradores (@GetUserEmail, @GetUserId, etc.)
  // Un solo decorador puede extraer cualquier propiedad del usuario
  //
  // TIPO DE RETORNO:
  // - Si data es undefined: User (objeto completo)
  // - Si data es string: any (propiedad específica)
  //   TypeScript no puede inferir el tipo exacto de user[data]
  //   Por eso el desarrollador debe especificar el tipo manualmente:
  //   @GetUser('email') email: string ← Especificamos que es string
  if (data) {
    return user[data];
  }

  // Retornar usuario completo si no se especificó una propiedad
  return user;
});
