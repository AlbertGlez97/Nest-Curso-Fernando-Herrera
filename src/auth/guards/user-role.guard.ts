import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { User } from '../entities/user.entity';
import { META_ROLES } from '../decorators/role-protected.decorator';

// =========================================================================
// GUARD: UserRoleGuard - VALIDACIÓN DE ROLES (AUTORIZACIÓN)
// =========================================================================
// Guard que verifica si el usuario tiene los roles necesarios para acceder
//
// =========================================================================
// CONCEPTOS CLAVE
// =========================================================================
//
// 1. GUARDS EN NESTJS:
//    - Clases que implementan la interfaz CanActivate
//    - Deciden si una petición puede continuar o debe ser bloqueada
//    - Se ejecutan DESPUÉS de los middlewares pero ANTES de los pipes
//    - Tienen acceso al ExecutionContext (request, response, handler, etc.)
//    - Retornan true (permitir) o false/excepción (denegar)
//
// 2. AUTORIZACIÓN VS AUTENTICACIÓN:
//    - Autenticación: ¿Quién eres? (AuthGuard - JWT)
//    - Autorización: ¿Qué puedes hacer? (UserRoleGuard - Roles)
//    - AuthGuard debe ejecutarse ANTES de UserRoleGuard
//    - UserRoleGuard necesita req.user adjuntado por AuthGuard
//
// 3. REFLECTOR:
//    - Servicio de NestJS para leer metadata de decoradores
//    - Permite leer la metadata definida por @SetMetadata o @RoleProtected
//    - Sintaxis: reflector.get<T>(metadataKey, target)
//    - Target puede ser: context.getHandler() (método) o context.getClass() (clase)
//
// 4. FLUJO DE AUTORIZACIÓN:
//    1. @RoleProtected(ValidRoles.ADMIN) define roles en metadata
//    2. AuthGuard valida JWT y adjunta usuario a req.user
//    3. UserRoleGuard lee la metadata de roles con Reflector
//    4. UserRoleGuard obtiene user.roles de req.user
//    5. UserRoleGuard verifica si hay coincidencia
//    6. Si coincide → return true (acceso permitido)
//    7. Si no coincide → throw ForbiddenException (403)
//
// 5. RBAC (Role-Based Access Control):
//    - Los usuarios tienen roles: ['user', 'admin', 'super-user']
//    - Las rutas requieren ciertos roles: ['admin', 'super-user']
//    - La validación es de tipo OR: Si el usuario tiene AL MENOS UN rol requerido, pasa
//    - Ejemplo: Usuario con ['user', 'admin'] puede acceder a ruta que requiere ['admin']
//
// =========================================================================
// ORDEN DE EJECUCIÓN:
// =========================================================================
//
// @Get('admin')
// @RoleProtected(ValidRoles.ADMIN)
// @UseGuards(AuthGuard(), UserRoleGuard)
// adminRoute() { }
//
// SECUENCIA:
// 1. Cliente envía petición con JWT
// 2. AuthGuard() valida JWT
// 3. JwtStrategy.validate() busca usuario en BD
// 4. AuthGuard() adjunta usuario a req.user
// 5. UserRoleGuard.canActivate() se ejecuta
// 6. UserRoleGuard lee metadata con Reflector
// 7. UserRoleGuard verifica roles
// 8. Si OK: Handler se ejecuta
// 9. Si FALLA: 403 Forbidden
//
// =========================================================================

@Injectable()
export class UserRoleGuard implements CanActivate {
  // =======================================================================
  // INYECCIÓN DE DEPENDENCIAS - REFLECTOR
  // =======================================================================
  // Reflector es un servicio de NestJS para leer metadata
  // Es necesario para obtener los roles requeridos definidos por @RoleProtected
  //
  // CONSTRUCTOR INJECTION:
  // NestJS automáticamente inyecta el servicio Reflector
  // porque está marcado con @Injectable()
  constructor(private readonly reflector: Reflector) {}

  // =======================================================================
  // canActivate: MÉTODO PRINCIPAL DEL GUARD
  // =======================================================================
  // Método requerido por la interfaz CanActivate
  // Determina si la petición actual puede continuar
  //
  // PARÁMETROS:
  // @param context - ExecutionContext que contiene información de la petición
  //
  // RETORNA:
  // - boolean: true = permitir acceso, false = denegar acceso
  // - Promise<boolean>: Para operaciones asíncronas
  // - Observable<boolean>: Para operaciones reactivas (RxJS)
  //
  // EXCEPCIONES:
  // - BadRequestException (400): Si el usuario no está en el request
  // - ForbiddenException (403): Si el usuario no tiene los roles requeridos
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // =====================================================================
    // PASO 1: LEER METADATA DE ROLES CON REFLECTOR
    // =====================================================================
    // Utilizando el decorador SetMetadata y extrayendo la metadata con Reflector, para el metodo priavate2
    // const validRoles: string[] = this.reflector.get<string[]>(
    //       'roles',
    //       context.getHandler(),
    // ); { validRoles: [ 'admin', 'super-user' ] }

    // Utilizando el decorador personalizado RoleProtected y extrayendo la metadata con Reflector, para el metodo priavate3
    // reflector.get<T>(metadataKey, target):
    // - Primer argumento: META_ROLES ('roles') - La clave de la metadata
    // - Segundo argumento: context.getHandler() - El método del controlador
    // - Tipo genérico: string[] - Esperamos un array de strings
    //
    // EJEMPLO DE METADATA:
    // @RoleProtected(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
    // → metadata: { 'roles': ['admin', 'super-user'] }
    // → validRoles = ['admin', 'super-user']
    //
    // ALTERNATIVA (leer metadata de la clase):
    // const validRoles = this.reflector.get(META_ROLES, context.getClass());
    // Útil si aplicas @RoleProtected a nivel de clase (todos los métodos)
    const validRoles: string[] = this.reflector.get<string[]>(
      META_ROLES,
      context.getHandler(),
    ); //{ validRoles: [ 'admin', 'super-user' ] }

    // =====================================================================
    // PASO 2: VERIFICAR SI HAY ROLES REQUERIDOS
    // =====================================================================
    // Si validRoles es undefined, null o array vacío,
    // significa que la ruta NO tiene restricción de roles
    //
    // CASOS EN QUE ESTO SUCEDE:
    // 1. @Auth() sin parámetros → Solo requiere autenticación
    // 2. @UseGuards(AuthGuard(), UserRoleGuard) sin @RoleProtected
    // 3. Ruta sin decoradores de roles
    //
    // IMPORTANTE:
    // Retornamos true para permitir el acceso
    // AuthGuard ya validó la autenticación, solo falta autorización
    // Si no hay roles requeridos, cualquier usuario autenticado puede acceder
    //
    // EJEMPLO:
    // @Get('profile')
    // @Auth() // Sin roles → validRoles = undefined
    // getProfile() { }
    // → UserRoleGuard retorna true (acceso permitido para cualquier usuario autenticado)
    if (!validRoles || validRoles.length === 0) {
      return true;
    }

    // =====================================================================
    // PASO 3: OBTENER EL REQUEST Y EXTRAER EL USUARIO
    // =====================================================================
    // context.switchToHttp().getRequest():
    // Cambia al contexto HTTP y obtiene el objeto request de Express
    //
    // req.user:
    // Usuario adjuntado por AuthGuard después de validar el JWT
    // Contiene toda la información del usuario de la base de datos
    //
    // CAST A USER:
    // as User le dice a TypeScript que req.user es de tipo User
    // Necesario porque req.user es de tipo 'any' en Express
    //
    // ESTRUCTURA DE req.user:
    // {
    //   id: "550e8400-...",
    //   email: "user@example.com",
    //   fullName: "Juan Pérez",
    //   isActive: true,
    //   roles: ["user", "admin"]
    // }
    const req = context.switchToHttp().getRequest();
    const user = req.user as User;

    // =====================================================================
    // PASO 4: VALIDAR QUE EL USUARIO EXISTA
    // =====================================================================
    // Si req.user es undefined, significa que:
    // 1. AuthGuard NO se ejecutó antes (error de configuración)
    // 2. AuthGuard falló pero no lanzó excepción (muy raro)
    // 3. Otro Guard eliminó req.user (error)
    //
    // IMPORTANTE:
    // Este error NO debería ocurrir nunca si usas @UseGuards correctamente
    // AuthGuard DEBE ir antes de UserRoleGuard
    //
    // CORRECTO:
    // @UseGuards(AuthGuard(), UserRoleGuard) ✅
    //
    // INCORRECTO:
    // @UseGuards(UserRoleGuard, AuthGuard()) ❌
    // → UserRoleGuard se ejecuta primero y req.user no existe aún
    //
    // CÓDIGO DE RESPUESTA:
    // 400 Bad Request - Error de configuración del servidor
    if (!user) throw new BadRequestException('User not found in request');

    // =====================================================================
    // PASO 5: VERIFICAR SI EL USUARIO TIENE ALGUNO DE LOS ROLES REQUERIDOS
    // =====================================================================
    // LÓGICA OR: Verificamos si el usuario tiene AL MENOS UN rol requerido
    //
    // BUCLE FOR:
    // Iteramos sobre cada rol del usuario
    // user.roles = ['user', 'admin']
    // validRoles = ['admin', 'super-user']
    //
    // EJEMPLO DE ITERACIÓN:
    // Iteración 1: role = 'user'
    //   ¿'user' está en ['admin', 'super-user']? → false
    //   Continuar...
    //
    // Iteración 2: role = 'admin'
    //   ¿'admin' está en ['admin', 'super-user']? → true ✅
    //   return true → Acceso permitido
    //
    // INCLUDES():
    // Método de arrays que verifica si un elemento existe
    // ['admin', 'super-user'].includes('admin') → true
    // ['admin', 'super-user'].includes('user') → false
    //
    // TIPO DE VALIDACIÓN:
    // Esta es una validación de tipo OR (lógico)
    // Si el usuario tiene CUALQUIERA de los roles requeridos, puede acceder
    //
    // ALTERNATIVA AND (todos los roles):
    // Si quisieras que el usuario tenga TODOS los roles:
    // const hasAllRoles = validRoles.every(role => user.roles.includes(role));
    // if (!hasAllRoles) throw new ForbiddenException(...);
    for (const role of user.roles) {
      if (validRoles.includes(role)) {
        return true; // Usuario tiene al menos un rol requerido
      }
    }

    // =====================================================================
    // PASO 6: DENEGAR ACCESO - USUARIO NO TIENE LOS ROLES REQUERIDOS
    // =====================================================================
    // Si llegamos aquí, significa que:
    // - El bucle for terminó sin encontrar coincidencias
    // - Ninguno de los roles del usuario está en los roles requeridos
    // - Ejemplo: user.roles = ['user'] pero se requiere ['admin']
    //
    // ForbiddenException:
    // Lanza una excepción HTTP 403 Forbidden
    // - 401 Unauthorized: No estás autenticado (sin token o token inválido)
    // - 403 Forbidden: Estás autenticado pero no tienes permisos
    //
    // MENSAJE DE ERROR:
    // Incluye información útil para el desarrollador:
    // - Nombre del usuario (user.fullName)
    // - Roles que se requieren (validRoles)
    //
    // EJEMPLO DE RESPUESTA:
    // {
    //   "statusCode": 403,
    //   "message": "User Juan Pérez need a valid role: [admin,super-user]",
    //   "error": "Forbidden"
    // }
    //
    // SEGURIDAD:
    // ⚠️ El mensaje revela información sobre los roles del sistema
    // En producción, considera usar un mensaje más genérico:
    // throw new ForbiddenException('Insufficient permissions');
    throw new ForbiddenException(
      `User ${user.fullName} need a valid role: [${validRoles}]`,
    );
  }
}
