# 08 - Autenticación y Gestión de Usuarios

## Índice

1. [Introducción](#introducción)
2. [Arquitectura del Módulo Auth](#arquitectura-del-módulo-auth)
3. [Entidad User](#entidad-user)
4. [Registro de Usuarios](#registro-de-usuarios)
5. [Seguridad con bcrypt](#seguridad-con-bcrypt)
6. [Sistema de Roles (RBAC)](#sistema-de-roles-rbac)
7. [Validación de Datos](#validación-de-datos)
8. [Soft Delete](#soft-delete)
9. [Próximos Pasos: JWT](#próximos-pasos-jwt)

---

## Documentación Completa

[authentication](https://docs.nestjs.com/security/authentication)

[passport](https://docs.nestjs.com/recipes/passport)

## Introducción

El módulo de autenticación (`AuthModule`) es fundamental en cualquier aplicación moderna. Gestiona:

- ✅ **Registro de usuarios** con validaciones estrictas
- ✅ **Contraseñas seguras** hasheadas con bcrypt
- ✅ **Sistema de roles** para autorización (RBAC)
- ✅ **Soft delete** para desactivar usuarios sin eliminarlos
- ⏳ **JWT tokens** (pendiente implementar)
- ⏳ **Guards y decoradores** (pendiente implementar)

---

## Arquitectura del Módulo Auth

### Estructura de Archivos

```
src/auth/
├── auth.module.ts           # Configuración del módulo
├── auth.controller.ts       # Endpoints HTTP
├── auth.service.ts          # Lógica de negocio
├── entities/
│   └── user.entity.ts       # Modelo de base de datos
└── dto/
    └── create-user.dto.ts   # Validación de entrada
```

### Flujo de Registro

```
Cliente → Controller → Service → Repository → PostgreSQL
   ↓          ↓           ↓          ↓            ↓
 JSON    Validación   Hasheo    TypeORM      Tabla users
         con DTO      bcrypt    .save()
```

---

## Entidad User

### Definición

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'text' })
  password: string; // ⚠️ Siempre hasheada, nunca en texto plano

  @Column({ type: 'text' })
  fullName: string;

  @Column({ type: 'bool', default: true })
  isActive: boolean; // Para soft delete

  @Column({ type: 'text', array: true, default: ['user'] })
  roles: string[]; // Sistema de roles
}
```

### Campos Explicados

| Campo      | Tipo          | Propósito                  | Ejemplo                                |
| ---------- | ------------- | -------------------------- | -------------------------------------- |
| `id`       | UUID          | Identificador único global | `550e8400-e29b-41d4-a716-446655440000` |
| `email`    | text (unique) | Username/login             | `user@example.com`                     |
| `password` | text          | Contraseña hasheada        | `$2b$10$N9qo8uLOickgx2ZM...`           |
| `fullName` | text          | Nombre real del usuario    | `Juan Pérez`                           |
| `isActive` | boolean       | Estado del usuario         | `true` / `false`                       |
| `roles`    | text[]        | Roles asignados            | `['user', 'admin']`                    |

### ¿Por qué UUID en lugar de AUTO_INCREMENT?

**UUID (usado aquí):**

```
✅ Único globalmente (no colisiona entre bases de datos)
✅ No revela cantidad de usuarios
✅ Seguro para URLs públicas
✅ Se puede generar en cliente o servidor
```

**AUTO_INCREMENT (tradicional):**

```
❌ Solo único en una BD
❌ Revela información: user/1, user/2, user/3...
❌ Facilita enumeración de registros
```

---

## Registro de Usuarios

### Endpoint

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "MyPassword123",
  "fullName": "Juan Pérez"
}
```

### Respuesta Exitosa (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "fullName": "Juan Pérez",
  "isActive": true,
  "roles": ["user"]
}
```

⚠️ **NOTA:** La contraseña NO se retorna en la respuesta por seguridad.

### Errores Comunes

| Status | Error             | Causa                            |
| ------ | ----------------- | -------------------------------- |
| 400    | Validation failed | Email inválido, contraseña débil |
| 400    | Duplicate key     | Email ya registrado              |
| 500    | Internal error    | Error de conexión a BD           |

---

## Seguridad con bcrypt

### ¿Qué es bcrypt?

bcrypt es un algoritmo de hashing diseñado específicamente para contraseñas:

- **Lento por diseño** → Dificulta ataques de fuerza bruta
- **Salt incorporado** → Misma contraseña genera hashes diferentes
- **Configurable** → Los "salt rounds" controlan la seguridad

### Proceso de Hashing

```typescript
const plainPassword = 'MyPassword123';
const hash = bcrypt.hashSync(plainPassword, 10);

console.log(hash);
// "$2b$10$N9qo8uLOickgx2ZMRZoMye.fN/K7g4R.RmKlBjH3hnL3MQFZ7qY/S"
```

**Componentes del hash:**

```
$2b$10$N9qo8uLOickgx2ZMRZoMye.fN/K7g4R.RmKlBjH3hnL3MQFZ7qY/S
│   │  │                      │
│   │  │                      └─ Hash real (31 chars)
│   │  └─ Salt aleatorio (22 chars)
│   └─ Salt rounds (10 = 2^10 = 1024 iteraciones)
└─ Algoritmo (2b = bcrypt)
```

### Salt Rounds

El número de salt rounds determina cuántas veces se ejecuta el algoritmo:

| Rounds | Iteraciones | Tiempo aprox. | Uso                         |
| ------ | ----------- | ------------- | --------------------------- |
| 8      | 256         | ~40ms         | Desarrollo rápido           |
| 10     | 1,024       | ~100ms        | ✅ Recomendado (producción) |
| 12     | 4,096       | ~400ms        | Alta seguridad              |
| 14     | 16,384      | ~1.6s         | Muy alta seguridad          |

**⚠️ Importante:** Cada incremento duplica el tiempo de procesamiento.

### Verificación de Contraseñas

```typescript
// Registro
const hash = bcrypt.hashSync('MyPassword123', 10);
// "$2b$10$N9qo8uLO..."

// Login (pendiente implementar)
const isValid = bcrypt.compareSync('MyPassword123', hash);
// true ✅

const isInvalid = bcrypt.compareSync('WrongPassword', hash);
// false ❌
```

### ¿Por qué NUNCA guardar contraseñas en texto plano?

```typescript
// ❌ NUNCA HACER ESTO
password: 'MyPassword123';

// ✅ SIEMPRE HACER ESTO
password: '$2b$10$N9qo8uLOickgx2ZMRZoMye...';
```

**Riesgos de contraseñas en texto plano:**

- ❌ Si hackean la BD, todas las contraseñas quedan expuestas
- ❌ Empleados con acceso a BD pueden ver contraseñas
- ❌ Logs y backups pueden filtrar contraseñas
- ❌ Ilegal en muchas jurisdicciones (GDPR, etc.)

---

## Sistema de Roles (RBAC)

### ¿Qué es RBAC?

**Role-Based Access Control** es un sistema de autorización basado en roles:

```typescript
roles: ['user']; // Usuario estándar
roles: ['user', 'admin']; // Usuario con privilegios de admin
roles: ['super-admin']; // Administrador total
```

### Roles Comunes

| Rol           | Permisos                | Uso                         |
| ------------- | ----------------------- | --------------------------- |
| `user`        | Acceso básico           | Usuario estándar registrado |
| `seller`      | Vender productos        | Vendedores en marketplace   |
| `moderator`   | Moderar contenido       | Moderadores de comunidad    |
| `admin`       | Panel de administración | Administradores             |
| `super-admin` | Acceso total            | Root/Owner                  |

### Implementación Actual

```typescript
@Column({
  type: 'text',
  array: true,
  default: ['user']  // Por defecto, rol 'user'
})
roles: string[];
```

### Ventajas de Array de Roles

```typescript
// ✅ Un usuario puede tener múltiples roles
{
  email: "john@example.com",
  roles: ['user', 'seller', 'moderator']
}

// ✅ Fácil de verificar con PostgreSQL
// SELECT * FROM users WHERE 'admin' = ANY(roles);

// ✅ Fácil de expandir sin cambiar esquema
roles.push('new-role');
```

### Uso con Guards (Pendiente)

```typescript
// Ejemplo de cómo se usará en el futuro:

@Post('products')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin', 'seller')  // Solo admin y seller
createProduct() { ... }

@Delete('users/:id')
@UseGuards(AuthGuard, RolesGuard)
@Roles('super-admin')  // Solo super-admin
deleteUser() { ... }
```

---

## Validación de Datos

### CreateUserDto

```typescript
export class CreateUserDto {
  @IsString()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)
  password: string;

  @IsString()
  @MinLength(1)
  fullName: string;
}
```

### Validación de Email

```typescript
@Transform(({ value }) => value.toLowerCase().trim())
```

**Normalización automática:**

```
Input:  " User@Example.COM "
Output: "user@example.com"
```

**Beneficios:**

- ✅ Previene duplicados: `User@example.com` vs `user@example.com`
- ✅ Elimina espacios accidentales
- ✅ Consistencia en la base de datos

### Validación de Contraseña

**Expresión regular:**

```regex
/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/
```

**Requisitos:**

- ✅ Al menos 1 letra mayúscula (A-Z)
- ✅ Al menos 1 letra minúscula (a-z)
- ✅ Al menos 1 número (0-9) O 1 carácter especial (!@#$%^&\*)
- ✅ Mínimo 6 caracteres
- ✅ Máximo 50 caracteres

**Ejemplos:**

| Contraseña    | ¿Válida? | Razón                       |
| ------------- | -------- | --------------------------- |
| `Password123` | ✅       | Cumple todos los requisitos |
| `MyPass1`     | ✅       | Cumple todos los requisitos |
| `Test@Pass`   | ✅       | Tiene carácter especial     |
| `password`    | ❌       | Sin mayúscula ni número     |
| `PASSWORD`    | ❌       | Sin minúscula               |
| `Pass`        | ❌       | Muy corta (< 6 chars)       |

---

## Soft Delete

### ¿Qué es Soft Delete?

En lugar de eliminar físicamente registros de la BD, los marcamos como inactivos:

```typescript
@Column({
  type: 'bool',
  default: true
})
isActive: boolean;
```

### Hard Delete vs Soft Delete

**Hard Delete (eliminar físicamente):**

```sql
DELETE FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

```
❌ Pérdida permanente de datos
❌ No se puede revertir
❌ Rompe relaciones (foreign keys)
❌ Se pierde historial
```

**Soft Delete (marcar como inactivo):**

```sql
UPDATE users SET isActive = false WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

```
✅ Datos conservados
✅ Se puede reactivar
✅ Relaciones intactas
✅ Historial preservado
✅ Auditable
```

### Casos de Uso

1. **Usuario solicita eliminación (GDPR)**

   ```typescript
   await userRepository.update(userId, { isActive: false });
   ```

2. **Admin suspende cuenta**

   ```typescript
   user.isActive = false;
   user.suspensionReason = 'Violación de términos';
   ```

3. **Usuario quiere "descanso"**
   ```typescript
   user.isActive = false;
   // Puede volver más tarde y reactivar su cuenta
   ```

### Filtrar Usuarios Inactivos

```typescript
// Solo usuarios activos
const activeUsers = await userRepository.find({
  where: { isActive: true },
});

// Todos los usuarios (incluyendo inactivos)
const allUsers = await userRepository.find();
```

---

## Próximos Pasos: JWT

### ¿Qué falta implementar?

1. **JWT Tokens**

   ```typescript
   // Instalar dependencias
   yarn add @nestjs/jwt @nestjs/passport passport passport-jwt
   yarn add -D @types/passport-jwt
   ```

2. **Login Endpoint**

   ```typescript
   POST /api/auth/login
   {
     "email": "user@example.com",
     "password": "MyPassword123"
   }

   // Respuesta:
   {
     "user": { ... },
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```

3. **JWT Strategy**

   ```typescript
   @Injectable()
   export class JwtStrategy extends PassportStrategy(Strategy) {
     constructor() {
       super({
         secretOrKey: process.env.JWT_SECRET,
         jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
       });
     }

     async validate(payload: JwtPayload) {
       // Verificar usuario y retornar
       return user;
     }
   }
   ```

4. **Auth Guard**

   ```typescript
   @Get('profile')
   @UseGuards(AuthGuard('jwt'))
   getProfile(@GetUser() user: User) {
     return user;
   }
   ```

5. **Roles Guard**

   ```typescript
   @Delete('users/:id')
   @UseGuards(AuthGuard('jwt'), RolesGuard)
   @Roles('admin')
   deleteUser() { ... }
   ```

6. **Custom Decorators**

   ```typescript
   // @GetUser() - Obtener usuario del request
   export const GetUser = createParamDecorator(
     (data, ctx: ExecutionContext) => {
       const request = ctx.switchToHttp().getRequest();
       return request.user;
     },
   );

   // @Roles() - Definir roles requeridos
   export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
   ```

---

## Resumen

### ✅ Lo que tenemos

- ✅ Módulo Auth configurado y funcional
- ✅ Entidad User con UUID y roles
- ✅ Registro de usuarios con validación
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Sistema de roles (RBAC)
- ✅ Soft delete con isActive
- ✅ Documentación Swagger

### ✅ Lo que tenemos AHORA (Actualizado)

- ✅ Login con JWT tokens
- ✅ Estrategia JWT con Passport
- ✅ Auth Guard para proteger rutas
- ✅ Roles Guard para autorización
- ✅ Decoradores personalizados (@GetUser, @Auth, @RoleProtected)
- ✅ Verificación de estado de autenticación (refresh token simplificado)

### ⏳ Pendiente (Mejoras Futuras)

- ⏳ Refresh tokens con rotación (implementación robusta)
- ⏳ Password reset con email
- ⏳ Two-Factor Authentication (2FA)
- ⏳ Rate limiting para login
- ⏳ Session management (logout en múltiples dispositivos)

---

## JWT (JSON Web Tokens)

### ¿Qué es JWT?

JWT es un **estándar abierto (RFC 7519)** para transmitir información de forma segura entre partes como un objeto JSON.

**Características:**

- ✅ **Stateless**: El servidor no necesita almacenar sesiones
- ✅ **Portable**: Funciona en cualquier lenguaje/plataforma
- ✅ **Compacto**: Puede enviarse en URLs, headers o cookies
- ✅ **Auto-contenido**: El token contiene toda la información necesaria

### Estructura de un JWT

Un JWT consta de **3 partes** separadas por puntos (`.`):

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDA3MjAwfQ.signature_here
```

**Partes:**

1. **Header** (rojo)
2. **Payload** (morado)
3. **Signature** (azul)

#### 1. Header (Encabezado)

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

- `alg`: Algoritmo de firma (HS256 = HMAC SHA-256)
- `typ`: Tipo de token (siempre "JWT")

#### 2. Payload (Carga útil)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "iat": 1700000000,
  "exp": 1700007200
}
```

**Claims estándar:**

- `iss` (issuer): Emisor del token
- `sub` (subject): Sujeto del token (user ID)
- `aud` (audience): Audiencia del token
- `exp` (expiration): Timestamp de expiración
- `iat` (issued at): Timestamp de emisión
- `nbf` (not before): No válido antes de...

**Claims personalizados:**

- `id`: ID del usuario
- `email`: Email del usuario
- `roles`: Roles del usuario (opcional)

#### 3. Signature (Firma)

```javascript
HMACSHA256(
  base64UrlEncode(header) + '.' + base64UrlEncode(payload),
  JWT_SECRET,
);
```

**Propósito:**

- ✅ Verificar que el token no fue modificado
- ✅ Garantizar que fue creado por nuestro servidor
- ⚠️ **NO encripta** el payload (cualquiera puede decodificarlo en jwt.io)

### Flujo de Autenticación JWT

```
1. Login
   Cliente → POST /api/auth/login {email, password}
            ↓
   Servidor → Valida credenciales
            → Genera JWT con id y email
            → Retorna token

2. Peticiones Protegidas
   Cliente → GET /api/profile
            → Header: Authorization: Bearer <token>
            ↓
   Servidor → Extrae token del header
            → Verifica firma con JWT_SECRET
            → Decodifica payload
            → Busca usuario en BD
            → Retorna datos
```

### Configuración JWT en NestJS

**Instalación:**

```bash
yarn add @nestjs/jwt @nestjs/passport passport passport-jwt
yarn add -D @types/passport-jwt
```

**Configuración del módulo:**

```typescript
// auth.module.ts
JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    secret: configService.get('JWT_SECRET'),
    signOptions: {
      expiresIn: '2h', // Token expira en 2 horas
    },
  }),
});
```

**Variables de entorno (.env):**

```env
JWT_SECRET=tu_clave_secreta_super_segura_aqui_min_32_chars
```

⚠️ **IMPORTANTE:**

- Usa una clave de al menos 32 caracteres
- Nunca subas el `.env` a Git
- Usa claves diferentes en desarrollo y producción

### Generación de Tokens

```typescript
// auth.service.ts
private getJwtToken(payload: JwtPayload) {
  const token = this.jwtService.sign(payload);
  return token;
}

// Uso
const token = this.getJwtToken({
  id: user.id,
  email: user.email
});
```

### Validación de Tokens

```typescript
// jwt.strategy.ts
async validate(payload: JwtPayload): Promise<User> {
  const { id } = payload;
  const user = await this.userRepository.findOneBy({ id });

  if (!user) throw new UnauthorizedException('Invalid token');
  if (!user.isActive) throw new UnauthorizedException('User is inactive');

  return user; // Se adjunta a req.user
}
```

### ⚠️ Seguridad JWT

**QUÉ NO incluir en el payload:**

- ❌ Contraseñas (ni hasheadas)
- ❌ Números de tarjetas de crédito
- ❌ Información médica sensible
- ❌ Claves API o secretos

**QUÉ SÍ incluir:**

- ✅ ID de usuario
- ✅ Email (para logging)
- ✅ Roles (opcional)
- ✅ Permisos (opcional)

**Razón:** El payload NO está encriptado, solo codificado en Base64. Cualquiera puede decodificarlo en [jwt.io](https://jwt.io).

---

## Passport.js

### ¿Qué es Passport?

**Passport** es un middleware de autenticación para Node.js que:

- ✅ Soporta múltiples estrategias (JWT, OAuth, Local, etc.)
- ✅ Se integra perfectamente con NestJS
- ✅ Simplifica la lógica de autenticación
- ✅ Es modular y extensible

### Estrategias de Passport

| Estrategia       | Uso                               | Paquete               |
| ---------------- | --------------------------------- | --------------------- |
| **passport-jwt** | Tokens JWT (usado aquí)           | `passport-jwt`        |
| passport-local   | Usuario/contraseña tradicional    | `passport-local`      |
| passport-google  | Login con Google                  | `passport-google`     |
| passport-github  | Login con GitHub                  | `passport-github`     |
| passport-saml    | SAML para empresas                | `passport-saml`       |
| passport-oauth2  | OAuth 2.0 genérico                | `passport-oauth2`     |

### JWT Strategy

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { id } = payload;
    const user = await this.userRepository.findOneBy({ id });

    if (!user) throw new UnauthorizedException('Token not valid');
    if (!user.isActive) throw new UnauthorizedException('User is inactive');

    return user; // Adjuntado a req.user
  }
}
```

**Funcionamiento:**

1. `jwtFromRequest`: Extrae el token del header `Authorization: Bearer <token>`
2. Passport verifica la firma usando `secretOrKey`
3. Si la firma es válida, decodifica el payload
4. Llama al método `validate()` con el payload
5. `validate()` retorna el usuario completo
6. Passport adjunta el usuario a `req.user`

### AuthGuard

```typescript
// Proteger una ruta
@Get('profile')
@UseGuards(AuthGuard())  // Usa la estrategia por defecto ('jwt')
getProfile(@GetUser() user: User) {
  return user;
}
```

**¿Qué hace AuthGuard?**

1. Intercepta la petición
2. Ejecuta la estrategia JWT
3. Si el token es válido → continúa
4. Si el token es inválido → 401 Unauthorized

---

## Guards en NestJS

### ¿Qué son los Guards?

Los **Guards** son clases que implementan la interfaz `CanActivate` y determinan si una petición puede continuar.

**Características:**

- Tienen acceso al `ExecutionContext`
- Se ejecutan **después** de middlewares
- Se ejecutan **antes** de pipes e interceptors
- Retornan `true` (permitir) o `false` (denegar)
- Pueden lanzar excepciones

### Orden de Ejecución

```
Cliente
  ↓
Middlewares (CORS, Logger, etc.)
  ↓
Guards ← Aquí se valida autenticación/autorización
  ↓
Interceptors (Before)
  ↓
Pipes (Validación de datos)
  ↓
Controller Handler
  ↓
Interceptors (After)
  ↓
Exception Filters
  ↓
Respuesta al Cliente
```

### Tipos de Guards

#### 1. Authentication Guard (AuthGuard)

**Propósito:** Verificar que el usuario está autenticado

```typescript
@Get('profile')
@UseGuards(AuthGuard())
getProfile(@GetUser() user: User) {
  return user;
}
```

**Flujo:**

```
1. Cliente envía token JWT
2. AuthGuard extrae token del header
3. JwtStrategy valida firma
4. JwtStrategy busca usuario en BD
5. Usuario se adjunta a req.user
6. Handler recibe usuario
```

#### 2. Authorization Guard (UserRoleGuard)

**Propósito:** Verificar que el usuario tiene los roles necesarios

```typescript
@Delete('products/:id')
@RoleProtected(ValidRoles.ADMIN)
@UseGuards(AuthGuard(), UserRoleGuard)
deleteProduct(@Param('id') id: string) {
  return this.service.delete(id);
}
```

**Flujo:**

```
1. AuthGuard valida JWT (adjunta user a req.user)
2. UserRoleGuard lee metadata de roles requeridos
3. UserRoleGuard obtiene user.roles de req.user
4. Si user.roles incluye algún rol requerido → permitir
5. Si no → 403 Forbidden
```

### Custom Guard: UserRoleGuard

```typescript
@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Leer roles requeridos de la metadata
    const validRoles = this.reflector.get<string[]>(
      META_ROLES,
      context.getHandler(),
    );

    // 2. Si no hay roles requeridos, permitir
    if (!validRoles || validRoles.length === 0) return true;

    // 3. Obtener usuario del request
    const req = context.switchToHttp().getRequest();
    const user = req.user as User;

    if (!user) throw new BadRequestException('User not found');

    // 4. Verificar si el usuario tiene algún rol requerido
    for (const role of user.roles) {
      if (validRoles.includes(role)) {
        return true; // Permitir acceso
      }
    }

    // 5. Denegar acceso
    throw new ForbiddenException(
      `User ${user.fullName} needs a valid role: [${validRoles}]`,
    );
  }
}
```

### Reflector y Metadata

**Reflector** es un servicio de NestJS para leer metadata adjunta por decoradores.

```typescript
// Definir metadata con @SetMetadata
@SetMetadata('roles', ['admin', 'super-user'])

// Leer metadata con Reflector
const roles = this.reflector.get<string[]>('roles', context.getHandler());
```

**Ventaja:** Permite comunicación entre decoradores y guards.

---

## Decoradores Personalizados

### ¿Qué son los Decoradores?

Los decoradores son funciones que modifican clases, métodos o propiedades en TypeScript.

**Tipos en NestJS:**

- **Class decorators**: `@Controller()`, `@Injectable()`
- **Method decorators**: `@Get()`, `@Post()`, `@UseGuards()`
- **Parameter decorators**: `@Body()`, `@Param()`, `@Query()`
- **Property decorators**: `@Column()`, `@PrimaryGeneratedColumn()`

### 1. @GetUser() - Extraer Usuario del Request

```typescript
export const GetUser = createParamDecorator((data, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  const user = req.user;

  if (!user) {
    throw new InternalServerErrorException('User not found in request');
  }

  // Si data existe, retornar solo esa propiedad
  return data ? user[data] : user;
});
```

**Uso:**

```typescript
// Usuario completo
@Get('profile')
@Auth()
getProfile(@GetUser() user: User) {
  return user;
}

// Solo email
@Get('email')
@Auth()
getEmail(@GetUser('email') email: string) {
  return { email };
}
```

### 2. @RawHeaders() - Extraer Headers

```typescript
export const RawHeaders = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const headers = req.headers;

    if (!headers) {
      throw new InternalServerErrorException('Headers not found');
    }

    return data ? headers[data] : headers;
  },
);
```

**Uso:**

```typescript
// Todos los headers
@Get('info')
getInfo(@RawHeaders() headers: any) {
  return headers;
}

// Header específico
@Get('token')
getToken(@RawHeaders('authorization') auth: string) {
  return { auth };
}
```

### 3. @RoleProtected() - Definir Roles Requeridos

```typescript
export const META_ROLES = 'roles';

export const RoleProtected = (...args: ValidRoles[]) => {
  return SetMetadata(META_ROLES, args);
};
```

**Uso:**

```typescript
@Delete('users/:id')
@RoleProtected(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
@UseGuards(AuthGuard(), UserRoleGuard)
deleteUser() { }
```

### 4. @Auth() - Decorador Compuesto (⭐ RECOMENDADO)

```typescript
export function Auth(...roles: ValidRoles[]) {
  return applyDecorators(
    RoleProtected(...roles),
    UseGuards(AuthGuard(), UserRoleGuard),
  );
}
```

**Ventajas:**

- ✅ Combina autenticación + autorización en una línea
- ✅ Código más limpio y mantenible
- ✅ Cambios centralizados

**Uso:**

```typescript
// Solo autenticación
@Get('profile')
@Auth()
getProfile(@GetUser() user: User) {
  return user;
}

// Autenticación + roles
@Delete('products/:id')
@Auth(ValidRoles.ADMIN)
deleteProduct(@Param('id') id: string) {
  return this.service.delete(id);
}

// Múltiples roles (OR lógico)
@Post('users')
@Auth(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
createUser(@Body() dto: CreateUserDto) {
  return this.service.create(dto);
}
```

### Comparación de Enfoques

**Enfoque 1: Manual (❌ No recomendado)**

```typescript
@Get('admin')
@SetMetadata('roles', ['admin'])
@UseGuards(AuthGuard(), UserRoleGuard)
adminRoute() { }
```

**Enfoque 2: Con @RoleProtected (⚠️ Mejor)**

```typescript
@Get('admin')
@RoleProtected(ValidRoles.ADMIN)
@UseGuards(AuthGuard(), UserRoleGuard)
adminRoute() { }
```

**Enfoque 3: Con @Auth (✅ RECOMENDADO)**

```typescript
@Get('admin')
@Auth(ValidRoles.ADMIN)
adminRoute() { }
```

---

## Login y Autenticación Completa

### Endpoint de Login

```typescript
@Post('login')
async login(@Body() loginUserDto: LoginUserDto) {
  return this.authService.login(loginUserDto);
}
```

### Flujo Completo de Login

```typescript
async login(loginUserDto: LoginUserDto) {
  const { email, password } = loginUserDto;

  // 1. Buscar usuario por email (incluyendo password)
  const user = await this.userRepository.findOne({
    where: { email },
    select: { email: true, password: true, id: true }
  });

  // 2. Validar que el usuario existe
  if (!user) {
    throw new UnauthorizedException('Credentials are not valid');
  }

  // 3. Comparar contraseñas con bcrypt
  if (!bcrypt.compareSync(password, user.password)) {
    throw new UnauthorizedException('Credentials are not valid');
  }

  // 4. Generar JWT token
  const token = this.getJwtToken({ id: user.id, email: user.email });

  // 5. Retornar usuario + token (sin contraseña)
  return {
    ...user,
    password: undefined,
    token
  };
}
```

**Petición:**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "MyPassword123"
}
```

**Respuesta:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "fullName": "Juan Pérez",
  "isActive": true,
  "roles": ["user"],
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDA3MjAwfQ.signature"
}
```

### Check Auth Status (Refresh Token Simplificado)

```typescript
@Get('check-auth-status')
@Auth()
checkAuthStatus(@GetUser() user: User) {
  return this.authService.checkAuthStatus(user);
}
```

**Propósito:**

- Verificar si el token sigue siendo válido
- Obtener un token nuevo (renovación)
- Obtener información actualizada del usuario

**Flujo:**

```
1. Cliente envía token actual
2. @Auth() valida el token
3. @GetUser() extrae el usuario
4. Se genera un token nuevo
5. Se retorna usuario + token nuevo
```

**Uso en Frontend:**

```typescript
async function checkAuth() {
  const token = localStorage.getItem('token');

  const response = await fetch('/api/auth/check-auth-status', {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  localStorage.setItem('token', data.token); // Nuevo token
  return data.user;
}
```

---

## Enum ValidRoles

### Definición

```typescript
export enum ValidRoles {
  ADMIN = 'admin',
  SUPER_USER = 'super-user',
  USER = 'user',
}
```

### ¿Por qué Enum en lugar de Strings?

**Sin Enum (❌ Propenso a errores):**

```typescript
@Auth('admon', 'super-user') // Typo: 'admon' en lugar de 'admin'
```

**Con Enum (✅ Type-safe):**

```typescript
@Auth(ValidRoles.ADMIN, ValidRoles.SUPER_USER); // TypeScript valida
```

**Ventajas:**

1. ✅ **Type-safety**: TypeScript detecta errores en compilación
2. ✅ **Autocompletado**: El IDE sugiere roles válidos
3. ✅ **Refactorización**: Cambiar un rol actualiza todos los usos
4. ✅ **Documentación**: Roles válidos en un solo lugar
5. ✅ **Consistencia**: Todos usan los mismos valores

### Roles del Sistema

| Rol          | Descripción             | Permisos                         |
| ------------ | ----------------------- | -------------------------------- |
| USER         | Usuario estándar        | Ver perfil, hacer compras        |
| ADMIN        | Administrador           | Gestionar productos y usuarios   |
| SUPER_USER   | Super administrador     | Todos los permisos del sistema   |

### Agregar Nuevos Roles

```typescript
export enum ValidRoles {
  ADMIN = 'admin',
  SUPER_USER = 'super-user',
  USER = 'user',
  MODERATOR = 'moderator', // ← Nuevo rol
  SELLER = 'seller', // ← Nuevo rol
}
```

---

## Casos de Uso Prácticos

### 1. Ruta Pública (Sin autenticación)

```typescript
@Get('products')
findAll() {
  return this.productsService.findAll();
}
```

### 2. Ruta Privada (Solo autenticados)

```typescript
@Get('profile')
@Auth()
getProfile(@GetUser() user: User) {
  return user;
}
```

### 3. Ruta con Rol Específico

```typescript
@Delete('products/:id')
@Auth(ValidRoles.ADMIN)
deleteProduct(@Param('id') id: string) {
  return this.service.delete(id);
}
```

### 4. Ruta con Múltiples Roles (OR)

```typescript
@Post('products')
@Auth(ValidRoles.ADMIN, ValidRoles.SELLER)
createProduct(@Body() dto: CreateProductDto) {
  return this.service.create(dto);
}
```

### 5. Obtener Usuario Actual

```typescript
@Get('my-orders')
@Auth()
getMyOrders(@GetUser() user: User) {
  return this.ordersService.findByUser(user.id);
}
```

### 6. Solo Super Admin

```typescript
@Delete('users/:id')
@Auth(ValidRoles.SUPER_USER)
deleteUser(@Param('id') id: string) {
  return this.usersService.remove(id);
}
```

---

## Mejores Prácticas de Seguridad

### 1. Contraseñas

- ✅ Siempre hashear con bcrypt
- ✅ Usar salt rounds >= 10
- ✅ Nunca loguear contraseñas
- ✅ Validar complejidad (mayúsculas, números)
- ✅ Longitud mínima de 6-8 caracteres

### 2. JWT Tokens

- ✅ Usar JWT_SECRET largo y aleatorio (32+ chars)
- ✅ Establecer expiración (1-2 horas)
- ✅ No incluir datos sensibles en el payload
- ✅ Validar tokens en cada petición
- ✅ Renovar tokens antes de expiración

### 3. Mensajes de Error

**❌ Evitar:**

```typescript
throw new UnauthorizedException('Email not found');
throw new UnauthorizedException('Password incorrect');
```

**✅ Preferir:**

```typescript
throw new UnauthorizedException('Credentials are not valid');
```

**Razón:** No revelar si el email existe (previene enumeración de usuarios)

### 4. Validación de Roles

- ✅ Validar roles en el servidor (nunca confiar en el cliente)
- ✅ Usar guards para proteger rutas
- ✅ Verificar que el usuario esté activo
- ✅ Implementar principio de mínimo privilegio

### 5. Rate Limiting

```typescript
// Limitar intentos de login
@Throttle(5, 60) // 5 intentos por minuto
@Post('login')
login() { }
```

---

## Códigos de Estado HTTP

| Código | Nombre                | Uso                               |
| ------ | --------------------- | --------------------------------- |
| 200    | OK                    | Petición exitosa                  |
| 201    | Created               | Recurso creado (registro exitoso) |
| 400    | Bad Request           | Datos inválidos                   |
| 401    | Unauthorized          | Token inválido o ausente          |
| 403    | Forbidden             | Token válido pero sin permisos    |
| 404    | Not Found             | Recurso no encontrado             |
| 500    | Internal Server Error | Error del servidor                |

---

## Diagrama de Arquitectura Completa

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                               │
│  (Navegador, Aplicación Móvil, Postman, etc.)              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP Request + JWT Token
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    NESTJS SERVER                             │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  1. MIDDLEWARES (CORS, Logger, etc.)                   │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  2. GUARDS                                             │ │
│  │     ├─ AuthGuard (Passport JWT)                        │ │
│  │     │    ├─ Extrae token                               │ │
│  │     │    ├─ Verifica firma                             │ │
│  │     │    └─ Ejecuta JwtStrategy.validate()             │ │
│  │     └─ UserRoleGuard                                   │ │
│  │          ├─ Lee metadata de roles                      │ │
│  │          └─ Verifica user.roles                        │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  3. PIPES (ValidationPipe, etc.)                       │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  4. CONTROLLER HANDLER                                 │ │
│  │     @Auth(ValidRoles.ADMIN)                            │ │
│  │     deleteProduct(@Param('id') id, @GetUser() user)    │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  5. SERVICE (Lógica de negocio)                        │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  6. REPOSITORY (TypeORM)                               │ │
│  └────────────────────┬───────────────────────────────────┘ │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │   POSTGRESQL DATABASE   │
           │   Tabla: users          │
           │   - id (UUID)           │
           │   - email               │
           │   - password (hash)     │
           │   - roles[]             │
           │   - isActive            │
           └────────────────────────┘
```

---

## Recursos Adicionales

### Documentación Oficial

- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [NestJS Passport](https://docs.nestjs.com/recipes/passport)
- [Passport.js Documentation](http://www.passportjs.org/)
- [JWT Introduction](https://jwt.io/introduction)

### Librerías

- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [@nestjs/jwt](https://github.com/nestjs/jwt)
- [@nestjs/passport](https://github.com/nestjs/passport)
- [passport-jwt](https://github.com/mikenicholson/passport-jwt)

### Seguridad

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

### Herramientas

- [JWT.io Debugger](https://jwt.io/) - Decodificar y validar JWTs
- [bcrypt Calculator](https://bcrypt-generator.com/) - Probar hashes de bcrypt
