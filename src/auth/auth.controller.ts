import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Headers,
  SetMetadata,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from './entities/user.entity';
import { GetUser, RawHeaders, RoleProtected } from './decorators';
import type { IncomingHttpHeaders } from 'http';
import { UserRoleGuard } from './guards';
import { ValidRoles } from './interfaces';
import { Auth } from './decorators/auth.decorator';

// =========================================================================
// CONTROLADOR DE AUTENTICACIÓN - ENDPOINTS RELACIONADOS CON USUARIOS
// =========================================================================
// Este controlador maneja todas las rutas HTTP relacionadas con
// autenticación y gestión de usuarios
//
// RUTAS BASE: /api/auth (por el prefijo global 'api' en main.ts)
//
// =========================================================================
// CONCEPTOS CLAVE
// =========================================================================
//
// 1. AUTENTICACIÓN VS AUTORIZACIÓN:
//    - Autenticación: ¿Quién eres? (Login, verificar identidad)
//    - Autorización: ¿Qué puedes hacer? (Permisos, roles)
//
// 2. JWT (JSON Web Token):
//    - Token firmado que contiene información del usuario (payload)
//    - Se envía en el header Authorization: Bearer <token>
//    - El servidor valida la firma sin consultar la BD cada vez
//    - Expira después de un tiempo configurable (2h por defecto)
//
// 3. GUARDS EN NESTJS:
//    - Middleware que decide si una petición puede continuar
//    - Se ejecutan ANTES del handler del controlador
//    - Pueden lanzar excepciones para bloquear el acceso
//    - Orden de ejecución: Global Guards → Controller Guards → Route Guards
//
// 4. DECORADORES PERSONALIZADOS:
//    - Extraen información del contexto de la petición
//    - Simplifican el código evitando repetición
//    - Ejemplos: @GetUser(), @RawHeaders(), @Auth()
//
// 5. METADATA Y REFLECTOR:
//    - SetMetadata: Adjunta datos a una ruta (ej: roles requeridos)
//    - Reflector: Lee esos datos dentro de un Guard
//    - Permite comunicación entre decoradores y guards
//
// =========================================================================

// DECORADOR @ApiTags:
// Agrupa estos endpoints en la sección "Auth" de Swagger UI
// Facilita la navegación en la documentación interactiva
@ApiTags('Auth')
// DECORADOR @Controller:
// Define que esta clase maneja rutas que empiezan con 'auth'
// Ruta completa: /api/auth (por el prefijo global)
@Controller('auth')
export class AuthController {
  // =======================================================================
  // INYECCIÓN DE DEPENDENCIAS
  // =======================================================================
  // NestJS inyecta automáticamente AuthService
  // Esto permite acceder a la lógica de negocio desde el controlador
  constructor(private readonly authService: AuthService) {}

  // =======================================================================
  // ENDPOINT: REGISTRAR NUEVO USUARIO (SIGN UP)
  // =======================================================================
  // Ruta: POST /api/auth/register
  //
  // FLUJO DE REGISTRO:
  // 1. Cliente envía JSON con { email, password, fullName }
  // 2. ValidationPipe valida datos usando CreateUserDto
  // 3. AuthService hashea la contraseña con bcrypt
  // 4. Se guarda el usuario en la base de datos
  // 5. Se genera un JWT token
  // 6. Se retorna { ...user, token } (sin contraseña)
  //
  // CÓDIGOS DE RESPUESTA:
  // - 201 Created: Usuario registrado exitosamente
  // - 400 Bad Request: Datos inválidos o email ya existe
  // - 500 Internal Server Error: Error inesperado del servidor
  //
  // EJEMPLO DE USO (fetch):
  // ```javascript
  // fetch('http://localhost:3000/api/auth/register', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     email: 'user@example.com',
  //     password: 'MyPassword123',
  //     fullName: 'Juan Pérez'
  //   })
  // })
  // ```
  //
  // RESPUESTA EXITOSA:
  // ```json
  // {
  //   "id": "550e8400-e29b-41d4-a716-446655440000",
  //   "email": "user@example.com",
  //   "fullName": "Juan Pérez",
  //   "isActive": true,
  //   "roles": ["user"],
  //   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  // }
  // ```
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o email ya registrado',
  })
  @Post('register')
  // PARÁMETROS:
  // @Body() extrae el cuerpo de la petición HTTP
  // createUserDto: CreateUserDto valida automáticamente los datos
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  // =======================================================================
  // ENDPOINT: INICIAR SESIÓN (LOGIN)
  // =======================================================================
  // Ruta: POST /api/auth/login
  //
  // FLUJO DE LOGIN:
  // 1. Cliente envía { email, password }
  // 2. AuthService busca el usuario por email (incluyendo password con select)
  // 3. Se compara la contraseña usando bcrypt.compareSync()
  // 4. Si coincide, se genera un JWT token
  // 5. Se retorna { ...user, token }
  //
  // SEGURIDAD:
  // - La contraseña nunca se retorna en la respuesta
  // - bcrypt.compareSync() compara de forma segura sin revelar el hash
  // - Se valida que el usuario esté activo (isActive: true)
  //
  // EJEMPLO DE USO:
  // ```javascript
  // fetch('http://localhost:3000/api/auth/login', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     email: 'user@example.com',
  //     password: 'MyPassword123'
  //   })
  // })
  // ```
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    type: User,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas',
  })
  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  // =======================================================================
  // ENDPOINT: RUTA PRIVADA - EJEMPLO BÁSICO DE AUTENTICACIÓN
  // =======================================================================
  // Ruta: GET /api/auth/private
  //
  // PROPÓSITO:
  // Endpoint de demostración que muestra cómo proteger rutas con JWT
  // y extraer información del usuario autenticado
  //
  // DECORADORES APLICADOS:
  //
  // @UseGuards(AuthGuard()):
  // - Protege la ruta requiriendo un JWT válido
  // - AuthGuard es de @nestjs/passport
  // - Sin parámetros usa la estrategia por defecto ('jwt')
  // - Si el token es inválido/ausente, retorna 401 Unauthorized
  //
  // @ApiBearerAuth():
  // - Documenta en Swagger que esta ruta requiere un Bearer Token
  // - Añade el candado 🔒 en la UI de Swagger
  // - Permite probar la ruta con autenticación desde Swagger
  //
  // DECORADORES PERSONALIZADOS:
  //
  // @GetUser():
  // - Extrae el usuario completo del request (req.user)
  // - El usuario fue adjuntado por JwtStrategy.validate()
  // - Retorna la entidad User completa
  //
  // @GetUser('email'):
  // - Extrae solo una propiedad específica del usuario
  // - Equivale a: req.user.email
  // - Evita acceder al objeto completo si solo necesitas un campo
  //
  // @RawHeaders():
  // - Extrae todos los headers HTTP de la petición
  // - Útil para debugging o logging
  // - Retorna array de strings: ['host: localhost', 'authorization: Bearer ...']
  //
  // FLUJO DE AUTENTICACIÓN:
  // 1. Cliente envía petición con header: Authorization: Bearer <token>
  // 2. AuthGuard() intercepta la petición
  // 3. Extrae el token del header
  // 4. JwtStrategy.validate() verifica el token y busca el usuario
  // 5. Si es válido, el usuario se adjunta a req.user
  // 6. El handler se ejecuta con acceso al usuario
  //
  // EJEMPLO DE USO:
  // ```javascript
  // fetch('http://localhost:3000/api/auth/private', {
  //   headers: {
  //     'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  //   }
  // })
  // ```
  //
  // RESPUESTA EXITOSA:
  // ```json
  // {
  //   "ok": true,
  //   "user": {
  //     "id": "550e8400-...",
  //     "email": "user@example.com",
  //     "fullName": "Juan Pérez",
  //     "isActive": true,
  //     "roles": ["user"]
  //   },
  //   "userEmail": "user@example.com",
  //   "rawHeaders": ["host: localhost:3000", "authorization: Bearer ..."],
  //   "message": "Hola mundo privado"
  // }
  // ```
  @Get('private')
  @UseGuards(AuthGuard())
  @ApiBearerAuth()
  testingPrivateRoute(
    //@Req() request: Express.Request
    @GetUser() user: User,
    @GetUser('email') userEmail: string,
    //@Headers() headers: IncomingHttpHeaders,
    @RawHeaders() rawHeaders: string[],
  ) {
    return {
      ok: true,
      //user: request.user,
      user,
      userEmail,
      //headers,
      rawHeaders,
      message: 'Hola mundo privado',
    };
  }

  // =======================================================================
  // ENDPOINT: RUTA PRIVADA CON ROLES - MÉTODO @SetMetadata
  // =======================================================================
  // Ruta: GET /api/auth/private2
  //
  // PROPÓSITO:
  // Demostración de autorización basada en roles usando @SetMetadata
  // Método directo pero menos elegante (ver private3 y private4 para mejores opciones)
  //
  // DECORADORES APLICADOS:
  //
  // @SetMetadata('roles', ['admin', 'super-user']):
  // - Adjunta metadata a esta ruta con la clave 'roles'
  // - Los roles permitidos son: 'admin' y 'super-user'
  // - Esta metadata será leída por UserRoleGuard
  // - Es el método más básico pero menos reutilizable
  //
  // @UseGuards(AuthGuard(), UserRoleGuard):
  // - AuthGuard(): Valida JWT y adjunta usuario a req.user
  // - UserRoleGuard: Lee la metadata 'roles' y verifica permisos
  // - Orden importante: AuthGuard primero para que UserRoleGuard tenga acceso a req.user
  //
  // FLUJO DE AUTORIZACIÓN:
  // 1. AuthGuard valida JWT → adjunta usuario a req.user
  // 2. UserRoleGuard se ejecuta:
  //    a. Lee metadata 'roles' con Reflector
  //    b. Obtiene user.roles del request
  //    c. Verifica si algún rol del usuario está en los roles permitidos
  //    d. Si no coincide, lanza ForbiddenException (403)
  // 3. Si pasa, el handler se ejecuta
  //
  // EJEMPLO DE VALIDACIÓN EN UserRoleGuard:
  // - Usuario tiene roles: ['user', 'admin']
  // - Ruta requiere: ['admin', 'super-user']
  // - ¿'admin' está en los roles permitidos? ✅ SÍ → Acceso permitido
  //
  // CÓDIGOS DE RESPUESTA:
  // - 200 OK: Usuario autenticado y autorizado
  // - 401 Unauthorized: Token inválido o ausente
  // - 403 Forbidden: Token válido pero sin permisos (roles insuficientes)
  //
  // LIMITACIONES DE ESTE MÉTODO:
  // - Debe escribir @SetMetadata manualmente en cada ruta
  // - Difícil de mantener si cambias la clave 'roles'
  // - No es type-safe (los roles son strings sin validación)
  // - Ver @RoleProtected (private3) o @Auth (private4) para mejores alternativas
  @Get('private2')
  @SetMetadata('roles', ['admin', 'super-user'])
  @UseGuards(AuthGuard(), UserRoleGuard)
  @ApiBearerAuth()
  privateRoute2(@GetUser() user: User) {
    return {
      ok: true,
      user,
    };
  }

  // =======================================================================
  // ENDPOINT: RUTA PRIVADA CON ROLES - DECORADOR @RoleProtected
  // =======================================================================
  // Ruta: GET /api/auth/private3
  //
  // PROPÓSITO:
  // Demostración de autorización usando el decorador personalizado @RoleProtected
  // Mejora sobre @SetMetadata al centralizar la lógica y usar enums type-safe
  //
  // DECORADORES APLICADOS:
  //
  // @RoleProtected(ValidRoles.SUPER_USER, ValidRoles.ADMIN):
  // - Decorador personalizado que envuelve @SetMetadata
  // - Usa el enum ValidRoles para type-safety
  // - Define la constante META_ROLES = 'roles' en un solo lugar
  // - Más mantenible que escribir @SetMetadata manualmente
  //
  // VENTAJAS DE @RoleProtected SOBRE @SetMetadata:
  // 1. Type-safety: ValidRoles.ADMIN previene typos ('admon' vs 'admin')
  // 2. Centralizado: META_ROLES definida en un solo archivo
  // 3. Autocompletado: IDE sugiere roles válidos
  // 4. Refactorización: Cambiar 'roles' solo requiere editar META_ROLES
  //
  // IMPLEMENTACIÓN DE @RoleProtected:
  // ```typescript
  // export const META_ROLES = 'roles';
  // export const RoleProtected = (...args: ValidRoles[]) => {
  //   return SetMetadata(META_ROLES, args);
  // };
  // ```
  //
  // FLUJO:
  // 1. @RoleProtected(ValidRoles.SUPER_USER, ValidRoles.ADMIN)
  // 2. → SetMetadata('roles', ['super-user', 'admin'])
  // 3. AuthGuard valida JWT
  // 4. UserRoleGuard lee metadata con Reflector.get(META_ROLES, ...)
  // 5. Verifica si user.roles incluye alguno de los roles requeridos
  //
  // ENUM ValidRoles:
  // ```typescript
  // export enum ValidRoles {
  //   ADMIN = 'admin',
  //   SUPER_USER = 'super-user',
  //   USER = 'user',
  // }
  // ```
  //
  // EJEMPLO DE USO:
  // - Usuario con roles: ['user', 'super-user']
  // - Ruta requiere: ValidRoles.SUPER_USER o ValidRoles.ADMIN
  // - ¿'super-user' está permitido? ✅ SÍ → Acceso concedido
  @Get('private3')
  @RoleProtected(ValidRoles.SUPER_USER, ValidRoles.ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  @ApiBearerAuth()
  privateRoute3(@GetUser() user: User) {
    return {
      ok: true,
      user,
    };
  }

  // =======================================================================
  // ENDPOINT: RUTA PRIVADA CON ROLES - DECORADOR COMPUESTO @Auth
  // =======================================================================
  // Ruta: GET /api/auth/private4
  //
  // PROPÓSITO:
  // Demostración del enfoque RECOMENDADO para proteger rutas
  // @Auth es un decorador compuesto que combina autenticación + autorización
  //
  // DECORADOR @Auth:
  // - Es un "meta-decorador" que aplica múltiples decoradores a la vez
  // - Combina: @RoleProtected + @UseGuards(AuthGuard(), UserRoleGuard)
  // - Usa applyDecorators() de NestJS para componer decoradores
  // - El código más limpio y expresivo de todos los ejemplos
  //
  // IMPLEMENTACIÓN DE @Auth:
  // ```typescript
  // export function Auth(...roles: ValidRoles[]) {
  //   return applyDecorators(
  //     RoleProtected(...roles),              // Define roles requeridos
  //     UseGuards(AuthGuard(), UserRoleGuard) // Aplica guards
  //   );
  // }
  // ```
  //
  // VENTAJAS DE @Auth:
  // 1. Una sola línea: @Auth(ValidRoles.ADMIN)
  // 2. DRY (Don't Repeat Yourself): No repetir @UseGuards en cada ruta
  // 3. Consistencia: Todos los desarrolladores usan el mismo patrón
  // 4. Mantenibilidad: Cambios en la lógica de auth se hacen en un solo lugar
  // 5. Legibilidad: Queda claro que la ruta requiere autenticación y roles
  //
  // COMPARACIÓN DE LOS TRES ENFOQUES:
  //
  // ENFOQUE 1 - @SetMetadata (private2):
  // ```typescript
  // @SetMetadata('roles', ['admin', 'super-user'])
  // @UseGuards(AuthGuard(), UserRoleGuard)
  // ```
  // ❌ Verboso, sin type-safety, propenso a errores
  //
  // ENFOQUE 2 - @RoleProtected (private3):
  // ```typescript
  // @RoleProtected(ValidRoles.SUPER_USER, ValidRoles.ADMIN)
  // @UseGuards(AuthGuard(), UserRoleGuard)
  // ```
  // ✅ Type-safe, pero aún requiere @UseGuards manual
  //
  // ENFOQUE 3 - @Auth (private4) ⭐ RECOMENDADO:
  // ```typescript
  // @Auth(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
  // ```
  // ✅ Conciso, type-safe, consistente, mantenible
  //
  // USO SIN ROLES (solo autenticación):
  // ```typescript
  // @Auth()  // Requiere estar autenticado pero sin restricción de roles
  // ```
  //
  // USO CON MÚLTIPLES ROLES:
  // ```typescript
  // @Auth(ValidRoles.ADMIN, ValidRoles.SUPER_USER, ValidRoles.MODERATOR)
  // ```
  //
  // CÓDIGOS DE RESPUESTA:
  // - 200 OK: Usuario autenticado y con roles adecuados
  // - 401 Unauthorized: Token ausente o inválido
  // - 403 Forbidden: Usuario válido pero sin los roles requeridos
  @Get('private4')
  @Auth(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
  @ApiBearerAuth()
  privateRoute4(@GetUser() user: User) {
    return {
      ok: true,
      user,
    };
  }

  // =======================================================================
  // ENDPOINT: VERIFICAR ESTADO DE AUTENTICACIÓN Y RENOVAR TOKEN
  // =======================================================================
  // Ruta: GET /api/auth/check-auth-status
  //
  // PROPÓSITO:
  // Endpoint para verificar si el token del usuario aún es válido
  // y obtener un token nuevo (refresh token pattern simplificado)
  //
  // CASOS DE USO:
  // 1. Frontend verifica si el usuario sigue autenticado al cargar la app
  // 2. Renovar el token antes de que expire (refresh token)
  // 3. Obtener información actualizada del usuario
  //
  // DECORADOR @Auth():
  // - Sin parámetros = solo requiere autenticación (cualquier rol)
  // - No valida roles específicos
  // - Equivale a @UseGuards(AuthGuard()) pero más limpio
  //
  // FLUJO:
  // 1. Cliente envía token actual en Authorization header
  // 2. @Auth() valida el token usando JwtStrategy
  // 3. @GetUser() extrae el usuario validado
  // 4. AuthService.checkAuthStatus() genera un nuevo token
  // 5. Se retorna el usuario + token nuevo
  //
  // ESTRATEGIA DE REFRESH TOKEN:
  // - En este caso, el token se renueva con cada petición exitosa
  // - El frontend debería guardar el nuevo token
  // - Alternativa más robusta: Usar refresh tokens por separado
  //
  // EJEMPLO DE USO (frontend):
  // ```javascript
  // // Al cargar la aplicación
  // async function checkAuth() {
  //   const token = localStorage.getItem('token');
  //   if (!token) return redirectToLogin();
  //
  //   try {
  //     const response = await fetch('/api/auth/check-auth-status', {
  //       headers: { 'Authorization': `Bearer ${token}` }
  //     });
  //
  //     const data = await response.json();
  //     localStorage.setItem('token', data.token); // Guardar nuevo token
  //     return data.user;
  //   } catch (error) {
  //     redirectToLogin(); // Token inválido o expirado
  //   }
  // }
  // ```
  //
  // RESPUESTA:
  // ```json
  // {
  //   "id": "550e8400-...",
  //   "email": "user@example.com",
  //   "fullName": "Juan Pérez",
  //   "isActive": true,
  //   "roles": ["user"],
  //   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Nuevo token
  // }
  // ```
  //
  // VENTAJAS DE ESTE ENFOQUE:
  // ✅ Simple de implementar
  // ✅ Mantiene la sesión activa mientras el usuario usa la app
  // ✅ No requiere tabla de refresh tokens en BD
  //
  // CONSIDERACIONES:
  // ⚠️ Si el token es robado, sigue siendo válido hasta que expire
  // ⚠️ Para apps críticas, considera refresh tokens con rotación
  // ⚠️ Implementa token blacklist para logout inmediato si es necesario
  @ApiResponse({
    status: 200,
    description: 'Token válido, devuelve usuario con nuevo token',
    type: User,
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido o expirado',
  })
  @Get('check-auth-status')
  @Auth()
  checkAuthStatus(@GetUser() user: User) {
    return this.authService.checkAuthStatus(user);
  }
}
