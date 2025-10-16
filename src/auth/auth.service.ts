import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { handleDBExceptions } from 'src/common/helpers/handleDBExceptions.helper';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, LoginUserDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';

// =========================================================================
// SERVICIO DE AUTENTICACIÓN - LÓGICA DE NEGOCIO PARA USUARIOS
// =========================================================================
// Este servicio maneja toda la lógica relacionada con autenticación:
// - Registro de usuarios (create)
// - Login de usuarios (login)
// - Generación de tokens JWT (getJwtToken)
// - Verificación de estado de autenticación (checkAuthStatus)
//
// =========================================================================
// CONCEPTOS CLAVE
// =========================================================================
//
// 1. HASHEO DE CONTRASEÑAS CON BCRYPT:
//    - bcrypt es un algoritmo de hashing diseñado para contraseñas
//    - Incluye un "salt" (valor aleatorio) único para cada contraseña
//    - Los "salt rounds" controlan la complejidad (10 = 2^10 = 1024 iteraciones)
//    - Mayor salt rounds = más seguro pero más lento
//    - El hash resultante incluye el salt, no es necesario guardarlo aparte
//
// 2. JWT (JSON WEB TOKEN):
//    - Estructura: header.payload.signature (3 partes separadas por punto)
//    - Header: Tipo de token y algoritmo (ej: {"alg": "HS256", "typ": "JWT"})
//    - Payload: Datos del usuario (id, email, roles, etc.)
//    - Signature: Firma criptográfica usando JWT_SECRET
//    - No es necesario consultar la BD para validar el token (solo verificar firma)
//    - El payload NO está encriptado, solo firmado (no guardar info sensible)
//
// 3. REPOSITORIOS DE TYPEORM:
//    - Capa de abstracción sobre la base de datos
//    - Métodos como .create(), .save(), .findOne(), .findOneBy()
//    - .create() solo crea el objeto en memoria
//    - .save() persiste el objeto en la base de datos
//
// 4. MANEJO DE ERRORES:
//    - Errores de BD (duplicados, constraints) son manejados por handleDBExceptions
//    - Errores de negocio (credenciales inválidas) lanzan excepciones específicas
//    - Logger registra errores para debugging
//
// =========================================================================

@Injectable()
export class AuthService {
  // =======================================================================
  // LOGGER - REGISTRO DE EVENTOS Y ERRORES
  // =======================================================================
  // Logger de NestJS para registrar información y errores
  // El nombre 'AuthService' aparecerá en los logs para identificar el origen
  //
  // NIVELES DE LOG:
  // - this.logger.log() - Información general
  // - this.logger.error() - Errores que requieren atención
  // - this.logger.warn() - Advertencias
  // - this.logger.debug() - Información de debugging
  // - this.logger.verbose() - Información muy detallada
  //
  // EJEMPLO DE LOG:
  // [Nest] 12345  - 01/01/2024, 10:30:00 AM   ERROR [AuthService] Database error...
  private readonly logger = new Logger('AuthService');

  // =======================================================================
  // INYECCIÓN DE DEPENDENCIAS
  // =======================================================================
  constructor(
    // REPOSITORIO DE USUARIOS:
    // TypeORM inyecta automáticamente el repositorio de la entidad User
    // Esto nos permite hacer operaciones CRUD sin escribir SQL
    //
    // DECORADOR @InjectRepository(User):
    // - Le dice a NestJS que inyecte el repositorio específico de User
    // - User debe estar registrado en TypeOrmModule.forFeature([User])
    // - Sin esto, TypeORM no sabría qué entidad manejar
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    // JWT SERVICE:
    // Servicio de @nestjs/jwt para firmar y verificar tokens
    //
    // MÉTODOS PRINCIPALES:
    // - jwtService.sign(payload) - Crea y firma un token JWT
    // - jwtService.verify(token) - Verifica la firma del token
    // - jwtService.decode(token) - Decodifica el payload sin verificar
    //
    // CONFIGURACIÓN:
    // - secret: JWT_SECRET del .env (clave para firmar tokens)
    // - signOptions: { expiresIn: '2h' } (tiempo de expiración)
    // - Configurado en auth.module.ts con JwtModule.registerAsync()
    private readonly jwtService: JwtService,
  ) {}

  // =======================================================================
  // CREAR USUARIO - REGISTRO EN EL SISTEMA
  // =======================================================================
  // Este método registra un nuevo usuario en la base de datos
  //
  // FLUJO DE REGISTRO:
  // 1. Recibe datos validados desde CreateUserDto
  // 2. Separa la contraseña del resto de datos
  // 3. Hashea la contraseña usando bcrypt
  // 4. Crea y guarda el usuario en BD
  // 5. Genera un JWT token
  // 6. Retorna usuario sin la contraseña (seguridad) + token
  //
  // PARÁMETROS:
  // @param createUserDto - Datos del usuario validados por class-validator
  //   - email: string (único, formato email válido)
  //   - password: string (mínimo 6 caracteres, con mayúsculas y números)
  //   - fullName: string (nombre completo del usuario)
  //
  // RETORNA:
  // Objeto con datos del usuario y token JWT:
  // {
  //   id: string,
  //   email: string,
  //   fullName: string,
  //   isActive: boolean,
  //   roles: string[],
  //   token: string
  // }
  //
  // EXCEPCIONES:
  // - BadRequestException: Si el email ya existe (código 23505 de PostgreSQL)
  // - InternalServerErrorException: Errores inesperados de BD
  async create(createUserDto: CreateUserDto) {
    try {
      // PASO 1: SEPARAR CONTRASEÑA DE LOS DEMÁS DATOS
      // Desestructuramos el DTO para manejar la contraseña por separado
      // password: La contraseña en texto plano que vamos a hashear
      // userData: El resto de propiedades (email, fullName)
      const { password, ...userData } = createUserDto;

      // PASO 2: CREAR ENTIDAD USER EN MEMORIA (NO EN BD AÚN)
      // .create() NO guarda en BD, solo crea el objeto con los datos
      const user = this.userRepository.create({
        ...userData, // Spread de email y fullName

        // HASHEO DE CONTRASEÑA CON BCRYPT:
        // bcrypt.hashSync() convierte la contraseña en texto plano a un hash
        //
        // PARÁMETROS:
        // - password: "MyPassword123" (texto plano)
        // - 10: salt rounds (número de iteraciones del algoritmo)
        //
        // PROCESO INTERNO DE BCRYPT:
        // 1. Genera un "salt" aleatorio de 16 bytes
        //    Ejemplo: "$2b$10$N9qo8uLOickgx2ZMRZoMye"
        //
        // 2. Combina el salt con la contraseña
        //    salt + password → "$2b$10$N9qo8uLOickgx2ZMRZoMye" + "MyPassword123"
        //
        // 3. Ejecuta el algoritmo de hashing 2^10 = 1024 veces
        //    Cada iteración hace el hash más costoso de calcular
        //    Esto dificulta los ataques de fuerza bruta
        //
        // 4. Retorna el hash final que incluye el salt
        //    Formato: $2b$rounds$salt$hash
        //    Ejemplo: "$2b$10$N9qo8uLOickgx2ZMRZoMye.fN/K7g4R.RmKlBjH3hnL3MQFZ7qY/S"
        //              ^   ^   ^                        ^
        //              |   |   |                        └─ Hash (31 caracteres)
        //              |   |   └─────────────────────────── Salt (22 caracteres)
        //              |   └───────────────────────────── Rounds (10)
        //              └───────────────────────────────── Algoritmo (2b)
        //
        // CARACTERÍSTICAS DEL HASH RESULTANTE:
        // - Longitud fija de ~60 caracteres
        // - Incluye el salt (no necesitas guardarlo por separado)
        // - Irreversible (no se puede obtener la contraseña original)
        // - Dos contraseñas iguales generan hashes diferentes (por el salt aleatorio)
        //
        // EJEMPLO PRÁCTICO:
        // Entrada:  "MyPassword123"
        // Salida:   "$2b$10$N9qo8uLOickgx2ZMRZoMye.fN/K7g4R.RmKlBjH3hnL3MQFZ7qY/S"
        //
        // SALT ROUNDS = 10 (RECOMENDADO PARA 2024):
        // - Es un balance entre seguridad y rendimiento
        // - Significa que el algoritmo se ejecuta 2^10 = 1024 veces
        // - Cada incremento duplica el tiempo de procesamiento:
        //   * 10 rounds ~ 100ms
        //   * 11 rounds ~ 200ms
        //   * 12 rounds ~ 400ms
        // - 10 es el valor recomendado por la documentación de bcrypt
        // - Para aplicaciones críticas (bancos) se usa 12-14
        //
        // ⚠️ IMPORTANTE: Usamos hashSync (síncrono) por simplicidad
        // En producción con alta carga, considera bcrypt.hash() (asíncrono)
        // para no bloquear el event loop de Node.js
        password: bcrypt.hashSync(password, 10),
      });

      // PASO 3: GUARDAR USUARIO EN LA BASE DE DATOS
      // .save() ejecuta el INSERT en PostgreSQL
      //
      // SQL GENERADO POR TYPEORM (aproximado):
      // INSERT INTO users (id, email, password, fullName, isActive, roles)
      // VALUES (
      //   '550e8400-e29b-41d4-a716-446655440000',  -- UUID generado automáticamente
      //   'user@example.com',                       -- email
      //   '$2b$10$...',                              -- password hasheado
      //   'Juan Pérez',                             -- fullName
      //   true,                                     -- isActive (default)
      //   ARRAY['user']                             -- roles (default)
      // )
      // RETURNING *;  -- Retorna el registro insertado
      //
      // NOTA SOBRE UUID:
      // - PostgreSQL genera el UUID automáticamente por @PrimaryGeneratedColumn('uuid')
      // - No es necesario generarlo manualmente
      // - UUID v4 garantiza unicidad global
      await this.userRepository.save(user);

      // PASO 4: GENERAR TOKEN JWT
      // Creamos un JWT token con el id y email del usuario
      // Este token será usado para autenticar peticiones futuras
      const token = this.getJwtToken({ id: user.id, email: user.email });

      // PASO 5: RETORNAR USUARIO SIN LA CONTRASEÑA + TOKEN
      // Eliminamos la contraseña del objeto antes de retornar (seguridad)
      //
      // SPREAD OPERATOR (...user):
      // Crea un nuevo objeto con todas las propiedades de user:
      // { id, email, fullName, isActive, roles, password }
      //
      // password: undefined:
      // Sobrescribe la propiedad password con undefined
      // En JSON se omite automáticamente (JSON.stringify ignora undefined)
      //
      // RESPUESTA FINAL:
      // {
      //   id: "550e8400-e29b-41d4-a716-446655440000",
      //   email: "user@example.com",
      //   fullName: "Juan Pérez",
      //   isActive: true,
      //   roles: ["user"],
      //   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      // }
      return {
        ...user,
        password: undefined, // Eliminar contraseña de la respuesta
        token,
      };
    } catch (error) {
      // MANEJO DE ERRORES DE BASE DE DATOS
      // handleDBExceptions maneja errores comunes de PostgreSQL:
      // - Código 23505: Violación de constraint UNIQUE (email duplicado)
      // - Otros códigos: Errores inesperados de BD
      //
      // LANZA:
      // - BadRequestException: Email ya existe
      // - InternalServerErrorException: Error inesperado
      handleDBExceptions(error, this.logger);
    }
  }

  // =======================================================================
  // LOGIN - INICIAR SESIÓN
  // =======================================================================
  // Este método valida las credenciales del usuario y genera un JWT
  //
  // FLUJO DE LOGIN:
  // 1. Busca el usuario por email (incluyendo el campo password)
  // 2. Verifica que el usuario exista
  // 3. Compara la contraseña usando bcrypt
  // 4. Verifica que el usuario esté activo
  // 5. Genera un JWT token
  // 6. Retorna usuario + token
  //
  // PARÁMETROS:
  // @param loginUserDto - Credenciales del usuario
  //   - email: string
  //   - password: string
  //
  // RETORNA:
  // Objeto con datos del usuario y token JWT
  //
  // EXCEPCIONES:
  // - UnauthorizedException: Credenciales inválidas o usuario inactivo
  async login(loginUserDto: LoginUserDto) {
    // Extraemos email y password del DTO validado
    const { email, password } = loginUserDto;

    try {
      // PASO 1: BUSCAR USUARIO POR EMAIL (INCLUYENDO PASSWORD)
      //
      // IMPORTANTE: Por defecto, la contraseña NO se incluye en las consultas
      // porque en user.entity.ts tiene la configuración: select: false
      //
      // Para incluir el password, usamos el parámetro "select":
      const user = await this.userRepository.findOne({
        // WHERE CLAUSE:
        // Busca el usuario donde el email coincida
        // SQL: SELECT * FROM users WHERE email = 'user@example.com'
        where: { email },

        // SELECT CLAUSE:
        // Especifica qué columnas queremos en el resultado
        // Por defecto TypeORM excluye password por "select: false"
        // Aquí forzamos la inclusión de password para poder comparar
        //
        // SQL GENERADO:
        // SELECT id, email, password FROM users WHERE email = 'user@example.com'
        //
        // NOTA: Solo seleccionamos id, email y password
        // Si necesitas más campos, agrégalos aquí:
        // select: { id: true, email: true, password: true, fullName: true }
        select: { email: true, password: true, id: true },
      });

      // PASO 2: VALIDAR QUE EL USUARIO EXISTA
      //
      // Si no encontramos un usuario con ese email, lanzamos error
      //
      // IMPORTANTE: El mensaje de error es genérico "Credentials are not valid"
      // NO revelamos si el email existe o no por seguridad
      // Previene ataques de enumeración de usuarios
      //
      // ❌ MAL: "Email no encontrado" (revela que el email no existe)
      // ✅ BIEN: "Credenciales inválidas" (no revela información)
      if (!user) {
        throw new Error('Credentials are not valid (email)');
      }

      // PASO 3: COMPARAR CONTRASEÑA CON BCRYPT
      //
      // bcrypt.compareSync(plainPassword, hash):
      // - plainPassword: Contraseña en texto plano del login
      // - hash: Contraseña hasheada guardada en BD
      // - Retorna: true si coinciden, false si no
      //
      // PROCESO INTERNO DE BCRYPT.COMPARE:
      // 1. Extrae el salt del hash almacenado
      //    Ejemplo hash: "$2b$10$N9qo8uLOickgx2ZMRZoMye.fN/K7g4R..."
      //                   ^   ^   ^--------- Salt
      //
      // 2. Usa el mismo salt para hashear la contraseña proporcionada
      //    bcrypt.hash(password, salt) → nuevo hash
      //
      // 3. Compara el nuevo hash con el hash almacado
      //    Si son iguales → contraseña correcta
      //    Si son diferentes → contraseña incorrecta
      //
      // SEGURIDAD:
      // - bcrypt.compare es "timing-safe" (tiempo constante)
      // - Previene ataques de timing donde se mide el tiempo de respuesta
      // - No revela información sobre cuántos caracteres coinciden
      //
      // EJEMPLO:
      // password ingresado: "MyPassword123"
      // hash en BD: "$2b$10$N9qo8uLOickgx2ZMRZoMye.fN/K7g4R..."
      // bcrypt.compareSync("MyPassword123", hash) → true ✅
      // bcrypt.compareSync("WrongPassword", hash) → false ❌
      if (!bcrypt.compareSync(password, user.password)) {
        throw new Error('Credentials are not valid (password)');
      }

      // PASO 4: VALIDACIÓN ADICIONAL - USUARIO ACTIVO
      // Aunque no está implementado aquí, es común verificar:
      // if (!user.isActive) {
      //   throw new UnauthorizedException('User is inactive');
      // }
      // Esta validación se hace en JwtStrategy.validate()

      // PASO 5: GENERAR JWT TOKEN
      // Creamos un token con el id y email del usuario
      const token = this.getJwtToken({ id: user.id, email: user.email });

      // PASO 6: RETORNAR USUARIO + TOKEN
      // Eliminamos la contraseña antes de retornar
      return {
        ...user,
        password: undefined, // No retornar contraseña por seguridad
        token,
      };
    } catch (error) {
      // MANEJO DE ERRORES
      // handleDBExceptions captura errores de base de datos
      // Los errores lanzados con throw new Error() también se capturan aquí
      handleDBExceptions(error, this.logger);
    }
  }

  // =======================================================================
  // CHECK AUTH STATUS - VERIFICAR ESTADO Y RENOVAR TOKEN
  // =======================================================================
  // Este método verifica el estado de autenticación del usuario
  // y genera un nuevo token (refresh token pattern simplificado)
  //
  // PROPÓSITO:
  // - Validar que el token actual siga siendo válido
  // - Renovar el token antes de que expire
  // - Obtener información actualizada del usuario
  //
  // PARÁMETROS:
  // @param user - Usuario extraído del JWT por JwtStrategy
  //   Ya ha sido validado y autenticado
  //
  // RETORNA:
  // Usuario completo + nuevo token JWT
  //
  // USO TÍPICO:
  // - Frontend llama a este endpoint al cargar la aplicación
  // - Si el token es válido, recibe uno nuevo
  // - Si el token expiró, recibe 401 Unauthorized
  checkAuthStatus(user: User) {
    // Generamos un nuevo token con la información del usuario
    // El usuario ya fue validado por JwtStrategy, así que es seguro
    const token = this.getJwtToken({ id: user.id, email: user.email });

    // Retornamos el usuario completo + nuevo token
    // El frontend debería guardar este nuevo token y usarlo
    // para peticiones futuras
    return {
      ...user,
      token, // Nuevo token generado
    };
  }

  // =======================================================================
  // GET JWT TOKEN - MÉTODO PRIVADO PARA GENERAR TOKENS
  // =======================================================================
  // Método helper privado que genera y firma un token JWT
  //
  // PARÁMETROS:
  // @param payload - Datos que se incluirán en el token
  //   Típicamente: { id: string, email: string }
  //
  // RETORNA:
  // String con el token JWT firmado
  //
  // PROCESO DE GENERACIÓN DE JWT:
  // 1. Toma el payload (datos del usuario)
  // 2. Lo codifica en Base64
  // 3. Crea el header con el algoritmo (HS256)
  // 4. Firma usando JWT_SECRET
  // 5. Retorna: header.payload.signature
  //
  // ESTRUCTURA DEL JWT GENERADO:
  // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDA3MjAwfQ.signature
  // ^                               ^                                                                                                                                       ^
  // |                               |                                                                                                                                       └─ Signature (firma)
  // |                               └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── Payload (datos)
  // └──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── Header
  //
  // DECODIFICACIÓN DEL PAYLOAD (jwt.io):
  // {
  //   "id": "550e8400-e29b-41d4-a716-446655440000",
  //   "email": "user@example.com",
  //   "iat": 1700000000,  // Issued At (timestamp de creación)
  //   "exp": 1700007200   // Expiration (timestamp de expiración)
  // }
  //
  // CONFIGURACIÓN (en auth.module.ts):
  // - secret: JWT_SECRET del .env
  // - signOptions: { expiresIn: '2h' }
  //
  // SEGURIDAD:
  // ⚠️ El payload NO está encriptado, solo codificado en Base64
  // ⚠️ Cualquiera puede decodificar el payload en jwt.io
  // ⚠️ NO incluir información sensible (contraseñas, tarjetas de crédito)
  // ✅ Solo incluir información de identificación (id, email, roles)
  // ✅ La firma garantiza que el token no ha sido modificado
  //
  // VALIDACIÓN DEL TOKEN:
  // - JwtStrategy verifica la firma usando JWT_SECRET
  // - Si la firma es inválida, el token es rechazado
  // - Si el token expiró (exp < now), se rechaza
  // - Si pasa ambas validaciones, se extrae el payload
  private getJwtToken(payload: JwtPayload) {
    // jwtService.sign() genera y firma el token
    // Automáticamente agrega "iat" (issued at) y "exp" (expiration)
    const token = this.jwtService.sign(payload);
    return token;
  }
}
