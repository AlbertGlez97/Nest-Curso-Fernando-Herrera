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

### ⏳ Pendiente

- ⏳ Login con JWT tokens
- ⏳ Estrategia JWT con Passport
- ⏳ Auth Guard para proteger rutas
- ⏳ Roles Guard para autorización
- ⏳ Decoradores personalizados (@GetUser, @Roles)
- ⏳ Refresh tokens
- ⏳ Password reset

---

## Recursos Adicionales

- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [JWT Introduction](https://jwt.io/introduction)
- [OWASP Password Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
