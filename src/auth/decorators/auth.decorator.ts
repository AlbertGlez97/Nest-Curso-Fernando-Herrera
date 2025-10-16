import { applyDecorators, UseGuards } from '@nestjs/common';
import { ValidRoles } from '../interfaces';
import { RoleProtected } from './role-protected.decorator';
import { UserRoleGuard } from '../guards';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';

// =========================================================================
// DECORADOR COMPUESTO: @Auth() - ⭐ RECOMENDADO
// =========================================================================
// Decorador que combina autenticación JWT y autorización basada en roles
// en un solo decorador fácil de usar
//
// =========================================================================
// CONCEPTOS CLAVE
// =========================================================================
//
// 1. DECORADORES COMPUESTOS (applyDecorators):
//    - Función de NestJS que combina múltiples decoradores en uno solo
//    - Permite crear abstracciones de alto nivel
//    - Reduce la repetición de código (DRY principle)
//    - Mejora la legibilidad y mantenibilidad
//
// 2. COMPOSICIÓN DE DECORADORES:
//    @Auth() = @RoleProtected() + @UseGuards(AuthGuard(), UserRoleGuard)
//    En una sola línea, aplica:
//    - Definición de roles requeridos (metadata)
//    - Validación de JWT (AuthGuard)
//    - Validación de roles (UserRoleGuard)
//
// 3. ORDEN DE EJECUCIÓN:
//    1. @RoleProtected(...roles) → Adjunta metadata de roles
//    2. @UseGuards(AuthGuard()) → Valida JWT y obtiene usuario
//    3. @UseGuards(UserRoleGuard) → Valida roles del usuario
//    4. Handler se ejecuta si todo pasa
//
// 4. FLUJO COMPLETO:
//    Cliente → JWT en header → AuthGuard valida → user en req.user
//    → UserRoleGuard lee metadata → UserRoleGuard verifica roles
//    → Si OK: Handler se ejecuta → Respuesta al cliente
//    → Si FALLA: 401 Unauthorized o 403 Forbidden
//
// =========================================================================
// USO DEL DECORADOR:
// =========================================================================
//
// CASO 1: Solo autenticación (sin restricción de roles)
// @Get('profile')
// @Auth()
// getProfile(@GetUser() user: User) {
//   // Cualquier usuario autenticado puede acceder
//   return { user };
// }
//
// CASO 2: Requiere rol específico
// @Delete('products/:id')
// @Auth(ValidRoles.ADMIN)
// deleteProduct(@Param('id') id: string) {
//   // Solo usuarios con rol 'admin' pueden acceder
//   return this.service.delete(id);
// }
//
// CASO 3: Requiere múltiples roles (OR lógico)
// @Post('users')
// @Auth(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
// createUser(@Body() dto: CreateUserDto) {
//   // Usuarios con rol 'admin' O 'super-user' pueden acceder
//   return this.service.create(dto);
// }
//
// CASO 4: Combinado con otros decoradores
// @Put('products/:id')
// @Auth(ValidRoles.ADMIN)
// @ApiBearerAuth()
// @ApiResponse({ status: 200, description: 'Product updated' })
// updateProduct(
//   @Param('id') id: string,
//   @Body() dto: UpdateProductDto,
//   @GetUser() user: User
// ) {
//   return this.service.update(id, dto, user);
// }
//
// =========================================================================
// COMPARACIÓN CON OTROS ENFOQUES:
// =========================================================================
//
// ENFOQUE 1 - Manual (sin decorador personalizado):
// @Get('admin')
// @SetMetadata('roles', ['admin'])
// @UseGuards(AuthGuard(), UserRoleGuard)
// adminRoute() { }
//
// PROBLEMAS:
// ❌ Verboso (3 líneas)
// ❌ Propenso a errores (typos en 'roles')
// ❌ Sin type-safety (strings libres)
// ❌ Difícil de mantener
//
// ENFOQUE 2 - Con @RoleProtected (mejor):
// @Get('admin')
// @RoleProtected(ValidRoles.ADMIN)
// @UseGuards(AuthGuard(), UserRoleGuard)
// adminRoute() { }
//
// VENTAJAS:
// ✅ Type-safety con ValidRoles
// ⚠️ Aún requiere @UseGuards manual (2 líneas)
//
// ENFOQUE 3 - Con @Auth (⭐ RECOMENDADO):
// @Get('admin')
// @Auth(ValidRoles.ADMIN)
// adminRoute() { }
//
// VENTAJAS:
// ✅ Una sola línea
// ✅ Type-safety con ValidRoles
// ✅ Guards aplicados automáticamente
// ✅ Consistente en toda la aplicación
// ✅ Fácil de mantener
// ✅ Código más limpio y legible
//
// =========================================================================
// VENTAJAS DEL ENFOQUE DRY (Don't Repeat Yourself):
// =========================================================================
//
// Sin @Auth (repetición en cada ruta):
// ```typescript
// @Get('route1')
// @RoleProtected(ValidRoles.ADMIN)
// @UseGuards(AuthGuard(), UserRoleGuard)
// route1() { }
//
// @Get('route2')
// @RoleProtected(ValidRoles.ADMIN)
// @UseGuards(AuthGuard(), UserRoleGuard)
// route2() { }
//
// @Get('route3')
// @RoleProtected(ValidRoles.ADMIN)
// @UseGuards(AuthGuard(), UserRoleGuard)
// route3() { }
// ```
//
// Con @Auth (DRY):
// ```typescript
// @Get('route1')
// @Auth(ValidRoles.ADMIN)
// route1() { }
//
// @Get('route2')
// @Auth(ValidRoles.ADMIN)
// route2() { }
//
// @Get('route3')
// @Auth(ValidRoles.ADMIN)
// route3() { }
// ```
//
// BENEFICIOS:
// 1. Menos líneas de código
// 2. Más fácil de leer
// 3. Cambios centralizados (modificas un solo lugar)
// 4. Menos posibilidad de errores
// 5. Onboarding más rápido para nuevos desarrolladores
//
// =========================================================================
// MANTENIBILIDAD:
// =========================================================================
//
// Si necesitas agregar un nuevo guard (ej: ThrottlerGuard):
//
// Sin @Auth:
// - Buscar todas las rutas con @UseGuards
// - Agregar ThrottlerGuard manualmente en cada una
// - Riesgo de olvidar algunas rutas
//
// Con @Auth:
// - Modificar solo la función Auth() una vez:
//   ```typescript
//   export function Auth(...roles: ValidRoles[]) {
//     return applyDecorators(
//       RoleProtected(...roles),
//       UseGuards(AuthGuard(), UserRoleGuard, ThrottlerGuard) // ← Agregar aquí
//     );
//   }
//   ```
// - Todas las rutas obtienen el nuevo guard automáticamente
//
// =========================================================================

// Auth: Función que crea el decorador compuesto @Auth
//
// PARÁMETROS:
// ...roles: ValidRoles[]
// - Operador spread (...) permite recibir 0 o más roles
// - Ejemplos:
//   * @Auth() → roles = [] (solo autenticación)
//   * @Auth(ValidRoles.ADMIN) → roles = [ValidRoles.ADMIN]
//   * @Auth(ValidRoles.ADMIN, ValidRoles.SUPER_USER) → roles = [...]
//
// RETORNA:
// El resultado de applyDecorators() que aplica múltiples decoradores
//
// TIPO DE RETORNO:
// <TFunction extends Function, TObj extends object>(
//   target: TObj | TFunction,
//   ...args
// ) => void
// (Es el tipo de un decorador de NestJS)
export function Auth(...roles: ValidRoles[]) {
  // applyDecorators:
  // Función de NestJS que aplica múltiples decoradores en secuencia
  //
  // FUNCIONAMIENTO INTERNO:
  // 1. Recibe un array de decoradores
  // 2. Los aplica uno por uno al método del controlador
  // 3. Cada decorador puede modificar o agregar metadata
  // 4. El orden importa: se aplican de izquierda a derecha
  //
  // EQUIVALENTE MANUAL:
  // ```typescript
  // function Auth(...roles) {
  //   return (target, key, descriptor) => {
  //     RoleProtected(...roles)(target, key, descriptor);
  //     UseGuards(AuthGuard(), UserRoleGuard)(target, key, descriptor);
  //   };
  // }
  // ```
  //
  // VENTAJA DE applyDecorators:
  // - Sintaxis más limpia
  // - Maneja automáticamente los tipos de TypeScript
  // - Garantiza que los decoradores se apliquen correctamente
  return applyDecorators(
    // =====================================================================
    // DECORADOR 1: RoleProtected(...roles)
    // =====================================================================
    // Define qué roles pueden acceder a esta ruta
    //
    // FUNCIONALIDAD:
    // - Adjunta metadata con la clave 'roles'
    // - Valor: Array de roles permitidos
    // - Si roles = [], no hay restricción de roles (cualquier usuario autenticado)
    //
    // METADATA GENERADA:
    // @Auth(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
    // → metadata: { 'roles': ['admin', 'super-user'] }
    //
    // USO EN UserRoleGuard:
    // const validRoles = this.reflector.get(META_ROLES, context.getHandler());
    // if (!validRoles || validRoles.length === 0) return true; // Sin restricción
    RoleProtected(...roles),

    // =====================================================================
    // DECORADOR 2: UseGuards(AuthGuard(), UserRoleGuard)
    // =====================================================================
    // Aplica los guards de autenticación y autorización
    //
    // ORDEN DE EJECUCIÓN DE GUARDS:
    // 1. AuthGuard() se ejecuta primero
    //    - Valida el JWT del header Authorization
    //    - Si es válido, llama a JwtStrategy.validate()
    //    - Adjunta el usuario a req.user
    //    - Si falla, lanza 401 Unauthorized
    //
    // 2. UserRoleGuard se ejecuta después
    //    - Lee la metadata de roles (definida por RoleProtected)
    //    - Obtiene user.roles de req.user (ya adjuntado por AuthGuard)
    //    - Verifica si algún rol del usuario está en los roles requeridos
    //    - Si coincide, permite el acceso
    //    - Si no coincide, lanza 403 Forbidden
    //
    // IMPORTANTE - ORDEN:
    // AuthGuard DEBE ir antes de UserRoleGuard
    // porque UserRoleGuard necesita req.user que AuthGuard adjunta
    //
    // DIAGRAMA DE FLUJO:
    // Petición → AuthGuard → JWT válido? → Sí → req.user
    //                      ↓
    //                     No → 401 Unauthorized
    // req.user → UserRoleGuard → Tiene rol? → Sí → Handler
    //                          ↓
    //                         No → 403 Forbidden
    //
    // CÓDIGOS DE RESPUESTA:
    // - 200 OK: Usuario autenticado y autorizado
    // - 401 Unauthorized: Token inválido, ausente o expirado
    // - 403 Forbidden: Token válido pero sin los roles requeridos
    UseGuards(AuthGuard(), UserRoleGuard),

    // =====================================================================
    // DECORADOR 3: ApiBearerAuth()
    // =====================================================================
    // Decorador de Swagger que indica que esta ruta requiere autenticación Bearer
    //
    // FUNCIONALIDAD:
    // - Muestra el icono del candado en Swagger UI
    // - Permite al usuario ingresar el token JWT
    // - Agrega automáticamente el header 'Authorization: Bearer <token>' en las peticiones
    //
    // IMPORTANTE:
    // - Debe estar configurado .addBearerAuth() en main.ts (DocumentBuilder)
    // - Sin esto, el candado no funcionará
    ApiBearerAuth(),
  );
}
