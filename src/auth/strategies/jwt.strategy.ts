import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';

// =========================================================================
// JWT STRATEGY - ESTRATEGIA DE AUTENTICACIÓN CON PASSPORT JWT
// =========================================================================
// Esta clase implementa la estrategia de autenticación JWT usando Passport.js
//
// =========================================================================
// CONCEPTOS CLAVE
// =========================================================================
//
// 1. PASSPORT.JS:
//    - Middleware de autenticación para Node.js
//    - Soporta múltiples estrategias (JWT, Local, OAuth, etc.)
//    - PassportStrategy es el wrapper de NestJS para integrar Passport
//
// 2. JWT STRATEGY:
//    - Estrategia específica para autenticación con JSON Web Tokens
//    - Extrae el token del header Authorization: Bearer <token>
//    - Verifica la firma del token usando el secreto (JWT_SECRET)
//    - Decodifica el payload si la firma es válida
//    - Llama al método validate() con el payload decodificado
//
// 3. FLUJO DE AUTENTICACIÓN:
//    1. Cliente envía petición con header: Authorization: Bearer <token>
//    2. AuthGuard() intercepta la petición
//    3. PassportStrategy extrae el token del header
//    4. Verifica la firma usando JWT_SECRET
//    5. Si la firma es válida, decodifica el payload
//    6. Llama a validate(payload) de esta clase
//    7. validate() retorna el usuario completo
//    8. El usuario se adjunta a req.user
//    9. El handler del controlador recibe el usuario
//
// 4. MÉTODO validate():
//    - Es llamado automáticamente por Passport después de verificar el JWT
//    - Recibe el payload decodificado del token
//    - IMPORTANTE: Aquí NO se valida la firma (Passport ya lo hizo)
//    - PROPÓSITO: Validar que el usuario aún existe y está activo
//    - Retorna el usuario completo (adjuntado a req.user)
//
// 5. CONFIGURACIÓN:
//    - secretOrKey: Clave para verificar la firma del token (JWT_SECRET)
//    - jwtFromRequest: Cómo extraer el token (del header Authorization)
//    - ignoreExpiration: false (por defecto, rechazar tokens expirados)
//
// =========================================================================
// REGISTRO EN EL MÓDULO:
// =========================================================================
// Esta estrategia debe estar registrada en auth.module.ts:
//
// @Module({
//   imports: [
//     PassportModule.register({ defaultStrategy: 'jwt' }),
//     JwtModule.register({ ... }),
//   ],
//   providers: [AuthService, JwtStrategy],  // ← Registrar JwtStrategy
//   exports: [JwtStrategy, PassportModule],  // ← Exportar para otros módulos
// })
//
// =========================================================================
// USO EN CONTROLADORES:
// =========================================================================
// Para proteger una ruta con JWT:
//
// @Get('private')
// @UseGuards(AuthGuard())  // ← Usa la estrategia por defecto ('jwt')
// privateRoute(@GetUser() user: User) {
//   return { user };
// }
//
// =========================================================================

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // =======================================================================
  // CONSTRUCTOR - CONFIGURACIÓN DE LA ESTRATEGIA JWT
  // =======================================================================
  constructor(
    // REPOSITORIO DE USUARIOS:
    // Necesario para buscar el usuario en la base de datos
    // después de validar el token
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    // CONFIG SERVICE:
    // Servicio para acceder a variables de entorno (.env)
    // Usado para obtener JWT_SECRET de forma segura
    configService: ConfigService,
  ) {
    // LLAMADA AL CONSTRUCTOR PADRE (PassportStrategy)
    // Aquí se configura la estrategia JWT de Passport
    super({
      // =================================================================
      // secretOrKey: CLAVE SECRETA PARA VERIFICAR LA FIRMA DEL JWT
      // =================================================================
      // Esta clave debe ser la MISMA usada para firmar los tokens
      // en AuthService.getJwtToken()
      //
      // PROCESO DE VERIFICACIÓN:
      // 1. Passport extrae el token del header
      // 2. Separa el token en: header.payload.signature
      // 3. Recalcula la firma usando: header + payload + secretOrKey
      // 4. Compara la firma recalculada con la firma del token
      // 5. Si coinciden → token válido, continúa
      // 6. Si no coinciden → token inválido, lanza UnauthorizedException
      //
      // SEGURIDAD:
      // - JWT_SECRET debe ser una cadena larga y aleatoria
      // - Mínimo 32 caracteres, mejor 64+
      // - NUNCA commitear en el código (usar .env)
      // - Cambiar el secreto invalida todos los tokens existentes
      //
      // EJEMPLO DE JWT_SECRET:
      // "MySecretKey123!@#$%^&*()_+AnotherRandomString456"
      //
      // configService.get('JWT_SECRET')!:
      // - Obtiene el valor de JWT_SECRET del .env
      // - El operador ! le dice a TypeScript que confiamos en que existe
      // - Si no existe, se lanza error en auth.module.ts
      secretOrKey: configService.get('JWT_SECRET')!,

      // =================================================================
      // jwtFromRequest: CÓMO EXTRAER EL TOKEN DE LA PETICIÓN
      // =================================================================
      // ExtractJwt.fromAuthHeaderAsBearerToken():
      // - Extrae el token del header Authorization
      // - Espera el formato: "Authorization: Bearer <token>"
      // - Separa el prefijo "Bearer " del token
      // - Retorna solo el token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      //
      // EJEMPLO DE HEADER:
      // Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSJ9.signature
      //                       ^
      //                       └─ Este es el token extraído
      //
      // ALTERNATIVAS (NO USADAS AQUÍ):
      // - ExtractJwt.fromUrlQueryParameter('token') - Token en ?token=xxx
      // - ExtractJwt.fromBodyField('token') - Token en el body
      // - ExtractJwt.fromHeader('x-auth-token') - Token en header custom
      //
      // RECOMENDACIÓN:
      // - Authorization header es el estándar para APIs REST
      // - Compatible con herramientas como Swagger, Postman, etc.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // =================================================================
      // OPCIONES ADICIONALES (NO ESPECIFICADAS, VALORES POR DEFECTO)
      // =================================================================
      // ignoreExpiration: false
      // - Por defecto, rechaza tokens expirados
      // - Si el token tiene exp < now, lanza UnauthorizedException
      //
      // passReqToCallback: false
      // - Si es true, validate() recibe (req, payload) en lugar de solo payload
      // - Útil si necesitas acceder a la petición completa
    });
  }

  // =======================================================================
  // VALIDATE - VALIDAR EL PAYLOAD DEL TOKEN Y OBTENER EL USUARIO
  // =======================================================================
  // Este método es llamado automáticamente por Passport después de:
  // 1. Extraer el token del header
  // 2. Verificar la firma del token (usando secretOrKey)
  // 3. Decodificar el payload del token
  //
  // IMPORTANTE:
  // - Passport YA validó la firma del token antes de llamar a validate()
  // - Si la firma era inválida, nunca se llama a validate()
  // - Aquí solo validamos que el usuario exista y esté activo
  //
  // PARÁMETROS:
  // @param payload - Datos decodificados del token JWT
  //   Típicamente: { id: string, email: string, iat: number, exp: number }
  //   Definido en JwtPayload interface
  //
  // RETORNA:
  // - Usuario completo de la base de datos (adjuntado a req.user)
  // - NestJS automáticamente adjunta el valor retornado a request.user
  //
  // EXCEPCIONES:
  // - UnauthorizedException: Si el usuario no existe o está inactivo
  //
  // FLUJO COMPLETO:
  // 1. Passport verifica firma del token ✅
  // 2. Passport decodifica payload: { id: "123", email: "user@example.com" }
  // 3. Passport llama a validate(payload)
  // 4. validate() busca el usuario en BD por id
  // 5. validate() verifica que el usuario esté activo
  // 6. validate() retorna el usuario completo
  // 7. NestJS adjunta el usuario a req.user
  // 8. El controlador puede usar @GetUser() para acceder al usuario
  async validate(payload: JwtPayload): Promise<User> {
    // PASO 1: EXTRAER DATOS DEL PAYLOAD
    // El payload contiene la información mínima del usuario
    // que fue incluida al generar el token en AuthService.getJwtToken()
    const { id, email } = payload;

    // PASO 2: BUSCAR USUARIO EN LA BASE DE DATOS POR ID
    //
    // IMPORTANTE: Buscamos por ID, no por email
    // - El ID es inmutable (nunca cambia)
    // - El email podría cambiar si el usuario actualiza su perfil
    // - Si buscáramos por email y el usuario lo cambió, el token quedaría inválido
    //
    // findOneBy({ id }):
    // - Busca un usuario donde el id coincida
    // - SQL: SELECT * FROM users WHERE id = '550e8400-...'
    // - Retorna el usuario completo (con todas sus propiedades)
    // - Retorna null si no encuentra el usuario
    //
    // NOTA: No necesitamos buscar por email, pero está en el payload
    // por si queremos hacer validaciones adicionales o logging
    const user = await this.userRepository.findOneBy({ id });

    // PASO 3: VALIDAR QUE EL USUARIO EXISTA
    //
    // CASOS EN QUE EL USUARIO NO EXISTE:
    // 1. Usuario fue eliminado de la base de datos
    // 2. Token fue generado con un ID que nunca existió (token manipulado)
    // 3. Base de datos fue restaurada a un backup anterior
    //
    // SEGURIDAD:
    // - Aunque el token sea válido (firma correcta), rechazamos la petición
    // - Previene que tokens de usuarios eliminados sigan siendo válidos
    // - El mensaje de error no revela si el usuario existía o no
    if (!user) {
      throw new UnauthorizedException('Invalid token - user does not exist');
    }

    // PASO 4: VALIDAR QUE EL USUARIO ESTÉ ACTIVO
    //
    // SOFT DELETE PATTERN:
    // - En lugar de eliminar usuarios físicamente (DELETE FROM users)
    // - Los marcamos como inactivos (UPDATE users SET isActive = false)
    // - Ventajas: Preserva historial, se puede reactivar, no rompe relaciones
    //
    // CASOS EN QUE EL USUARIO ESTÁ INACTIVO:
    // 1. Usuario solicitó eliminar su cuenta (GDPR compliance)
    // 2. Administrador suspendió la cuenta por violación de términos
    // 3. Usuario quiere "pausar" su cuenta temporalmente
    //
    // IMPORTANTE:
    // - Aunque el token sea válido, rechazamos usuarios inactivos
    // - Esto garantiza que cuentas suspendidas no puedan acceder
    // - Para reactivar, el admin debe cambiar isActive = true en BD
    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive, talk with an admin');
    }

    // PASO 5: RETORNAR USUARIO COMPLETO
    //
    // El usuario retornado se adjunta automáticamente a req.user
    // Esto permite acceder al usuario en los controladores:
    //
    // OPCIÓN 1 - Usando @Req():
    // @Get('profile')
    // getProfile(@Req() req: Request) {
    //   console.log(req.user); // Usuario completo
    // }
    //
    // OPCIÓN 2 - Usando decorador personalizado @GetUser():
    // @Get('profile')
    // getProfile(@GetUser() user: User) {
    //   console.log(user); // Usuario completo (más limpio)
    // }
    //
    // OPCIÓN 3 - Extraer solo una propiedad:
    // @Get('profile')
    // getProfile(@GetUser('email') email: string) {
    //   console.log(email); // Solo el email
    // }
    //
    // NOTA: El usuario retornado NO incluye la contraseña
    // porque en user.entity.ts la contraseña tiene { select: false }
    return user;
  }
}
