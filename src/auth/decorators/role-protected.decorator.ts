import { SetMetadata } from '@nestjs/common';
import { ValidRoles } from '../interfaces';

// =========================================================================
// DECORADOR PERSONALIZADO: @RoleProtected()
// =========================================================================
// Decorador que define qué roles pueden acceder a una ruta
//
// =========================================================================
// CONCEPTOS CLAVE
// =========================================================================
//
// 1. METADATA EN NESTJS:
//    - Es información adicional adjunta a clases, métodos o propiedades
//    - Se define con decoradores como @SetMetadata(clave, valor)
//    - Se lee con el servicio Reflector dentro de Guards
//    - Permite comunicación entre decoradores y guards
//
// 2. REFLECTOR:
//    - Servicio de NestJS para leer metadata
//    - Se usa dentro de Guards para obtener los roles requeridos
//    - Sintaxis: reflector.get('clave', context.getHandler())
//
// 3. RBAC (Role-Based Access Control):
//    - Sistema de control de acceso basado en roles
//    - Los usuarios tienen roles: ['user', 'admin', 'super-user']
//    - Las rutas requieren ciertos roles para acceder
//    - El Guard verifica si el usuario tiene alguno de los roles requeridos
//
// 4. FLUJO DE AUTORIZACIÓN:
//    1. @RoleProtected(ValidRoles.ADMIN) define roles requeridos
//    2. UserRoleGuard lee los roles con Reflector
//    3. UserRoleGuard obtiene user.roles del request
//    4. UserRoleGuard verifica si hay coincidencia
//    5. Si coincide → acceso permitido (200 OK)
//    6. Si no coincide → acceso denegado (403 Forbidden)
//
// =========================================================================
// USO DEL DECORADOR:
// =========================================================================
//
// CASO 1: Ruta solo para administradores
// @Get('admin-panel')
// @RoleProtected(ValidRoles.ADMIN)
// @UseGuards(AuthGuard(), UserRoleGuard)
// adminPanel(@GetUser() user: User) {
//   return { message: 'Welcome admin' };
// }
//
// CASO 2: Ruta para múltiples roles
// @Delete('products/:id')
// @RoleProtected(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
// @UseGuards(AuthGuard(), UserRoleGuard)
// deleteProduct(@Param('id') id: string) {
//   return this.service.delete(id);
// }
//
// CASO 3: Combinado con otros decoradores
// @Post('users')
// @RoleProtected(ValidRoles.SUPER_USER)
// @UseGuards(AuthGuard(), UserRoleGuard)
// @ApiBearerAuth()
// createUser(@Body() dto: CreateUserDto) {
//   return this.service.create(dto);
// }
//
// =========================================================================
// VENTAJAS SOBRE @SetMetadata DIRECTO:
// =========================================================================
//
// ANTES (sin decorador personalizado):
// @Get('admin')
// @SetMetadata('roles', ['admin', 'super-user'])
// @UseGuards(AuthGuard(), UserRoleGuard)
// adminRoute() { }
//
// DESPUÉS (con @RoleProtected):
// @Get('admin')
// @RoleProtected(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
// @UseGuards(AuthGuard(), UserRoleGuard)
// adminRoute() { }
//
// VENTAJAS:
// 1. Type-safety: ValidRoles.ADMIN en lugar de strings
// 2. Autocompletado del IDE
// 3. Refactorización segura (cambiar nombre de rol)
// 4. Clave 'roles' centralizada en META_ROLES
// 5. Menos propenso a errores (typos)
//
// =========================================================================

// META_ROLES: Clave única para identificar la metadata de roles
// Esta constante se usa tanto aquí (para definir) como en UserRoleGuard (para leer)
//
// IMPORTANCIA DE CENTRALIZAR LA CLAVE:
// - Si cambias 'roles' a 'requiredRoles', solo cambias aquí
// - Sin esto, tendrías que buscar todos los @SetMetadata('roles', ...)
// - Previene inconsistencias entre decorador y guard
//
// EXPORT:
// Exportamos para que UserRoleGuard pueda importarla:
// const roles = this.reflector.get(META_ROLES, context.getHandler());
export const META_ROLES = 'roles';

// RoleProtected: Función que crea el decorador @RoleProtected
//
// PARÁMETROS:
// ...args: ValidRoles[]
// - Operador spread (...) permite recibir múltiples argumentos
// - Ejemplo: RoleProtected(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
// - args se convierte en array: [ValidRoles.ADMIN, ValidRoles.SUPER_USER]
//
// RETORNA:
// SetMetadata(META_ROLES, args)
// - Adjunta la metadata a la ruta
// - Clave: META_ROLES ('roles')
// - Valor: Array de roles permitidos
//
// EJEMPLO DE METADATA GENERADA:
// @RoleProtected(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
// →
// SetMetadata('roles', ['admin', 'super-user'])
//
// LECTURA EN UserRoleGuard:
// const validRoles = this.reflector.get<string[]>(META_ROLES, context.getHandler());
// → validRoles = ['admin', 'super-user']
export const RoleProtected = (...args: ValidRoles[]) => {
  // SetMetadata:
  // Decorador de NestJS que adjunta metadata personalizada
  //
  // PARÁMETROS:
  // 1. META_ROLES ('roles'): La clave para identificar esta metadata
  // 2. args: El valor a guardar (array de roles)
  //
  // INTERNAMENTE:
  // SetMetadata usa Reflect.defineMetadata() de TypeScript
  // para adjuntar la información al método del controlador
  //
  // ALMACENAMIENTO:
  // La metadata se guarda en el método del controlador
  // y persiste durante toda la vida de la aplicación
  //
  // ACCESO:
  // Solo se puede leer con el servicio Reflector de NestJS:
  // this.reflector.get(META_ROLES, context.getHandler())
  //
  // ESTRUCTURA INTERNA (conceptual):
  // {
  //   target: ControllerClass.prototype.methodName,
  //   metadata: {
  //     'roles': ['admin', 'super-user']
  //   }
  // }
  return SetMetadata(META_ROLES, args);
};
