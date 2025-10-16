# Entidad User

[← Volver al índice](./README.md)

## Estructura de la Entidad

La entidad **User** representa a los usuarios del sistema en la base de datos PostgreSQL.

### Código Base

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { unique: true })
  email: string;

  @Column('text', { select: false })
  password: string;

  @Column('text')
  fullName: string;

  @Column('bool', { default: true })
  isActive: boolean;

  @Column('text', {
    array: true,
    default: [ValidRoles.USER]
  })
  roles: string[];
}
```

---

## Campos de la Entidad

### 🔑 ID (Primary Key)

```typescript
@PrimaryGeneratedColumn('uuid')
id: string;
```

**Características:**
- Tipo: UUID (Universally Unique Identifier)
- Generado automáticamente por PostgreSQL
- Formato: `550e8400-e29b-41d4-a716-446655440000`

**Ventajas de UUID vs ID incremental:**

| UUID                          | ID Incremental (1, 2, 3...)   |
| ----------------------------- | ----------------------------- |
| ✅ No predecible              | ❌ Predecible (fácil enumerar) |
| ✅ Único globalmente          | ❌ Único solo en la tabla      |
| ✅ Seguro para URLs públicas  | ❌ Revela cantidad de usuarios |
| ❌ Más espacio (36 caracteres)| ✅ Menos espacio (números)     |

**Ejemplo de uso:**
```typescript
// URL con UUID (segura)
GET /api/users/550e8400-e29b-41d4-a716-446655440000

// URL con ID incremental (insegura)
GET /api/users/1234
// Atacante puede probar: /api/users/1235, /api/users/1236...
```

---

### 📧 Email (Identificador único)

```typescript
@Column('text', { unique: true })
email: string;
```

**Características:**
- Tipo: `text` en PostgreSQL
- **Constraint UNIQUE**: No puede haber emails duplicados
- Usado para login (identificador del usuario)

**Validación en DTO:**
```typescript
@IsEmail()
@IsString()
@IsNotEmpty()
email: string;
```

**¿Por qué unique?**
- Cada usuario debe tener un email único
- Si intentas crear un usuario con email existente → PostgreSQL lanza error
- NestJS captura el error y retorna `500 Internal Server Error`

---

### 🔒 Password (Hasheada con bcrypt)

```typescript
@Column('text', { select: false })
password: string;
```

**Características clave:**

#### `select: false`
Por defecto, TypeORM **NO incluye** este campo en las consultas.

```typescript
// Consulta normal (NO incluye password)
const user = await userRepository.findOne({ where: { id } });
// user = { id: '...', email: 'john@example.com', fullName: 'John' }
// password NO está presente ✅

// Para incluir password (solo en login)
const user = await userRepository.findOne({
  where: { email },
  select: { email: true, password: true, id: true }
});
// user = { id: '...', email: '...', password: '$2b$10...' }
```

**¿Por qué `select: false`?**
- **Seguridad:** Evita filtrar passwords accidentalmente
- Solo se incluye cuando explícitamente lo pides (login)
- Las respuestas de API nunca incluyen password por defecto

#### Valor almacenado
```typescript
// NUNCA se guarda en texto plano ❌
password: "MyPassword123"

// SIEMPRE se guarda hasheado ✅
password: "$2b$10$N9qo8uLOickgx2ZMRZoMye.fN/K7g4R.RmKlBjH3hnL3MQFZ7qY/S"
```

Ver más: **[04-bcrypt.md](./04-bcrypt.md)**

---

### 👤 Full Name

```typescript
@Column('text')
fullName: string;
```

**Características:**
- Nombre completo del usuario
- Campo obligatorio (sin `nullable: true`)
- Usado para mostrar en UI

**Validación en DTO:**
```typescript
@IsString()
@MinLength(1)
fullName: string;
```

---

### ✅ isActive (Soft Delete)

```typescript
@Column('bool', { default: true })
isActive: boolean;
```

**Soft Delete Pattern:**

En lugar de eliminar usuarios físicamente de la base de datos, se marca como inactivo.

```typescript
// ❌ Hard Delete (elimina el registro)
await userRepository.delete(id);

// ✅ Soft Delete (marca como inactivo)
user.isActive = false;
await userRepository.save(user);
```

**Ventajas:**
- ✅ Permite reactivar usuarios
- ✅ Mantiene integridad referencial (relaciones con otras tablas)
- ✅ Auditoría (historial completo)
- ✅ Recuperación de datos accidentalmente "eliminados"

**Uso en Login:**
```typescript
// En jwt.strategy.ts
if (!user.isActive) {
  throw new UnauthorizedException('User is inactive');
}
```

---

### 🔐 Roles (RBAC)

```typescript
@Column('text', {
  array: true,
  default: [ValidRoles.USER]
})
roles: string[];
```

**Características:**

#### Array de strings en PostgreSQL
PostgreSQL soporta tipos array nativamente:

```sql
-- En PostgreSQL
roles text[] DEFAULT '{user}'
```

```typescript
// En TypeScript
roles: ['user']           // Usuario estándar
roles: ['admin']          // Administrador
roles: ['user', 'admin']  // Múltiples roles
```

#### Valor por defecto
Todos los nuevos usuarios reciben automáticamente el rol `'user'`:

```typescript
const user = this.userRepository.create({
  email: 'john@example.com',
  password: hash,
  fullName: 'John Doe'
  // roles no especificado → PostgreSQL usa default: ['user']
});
```

#### Enum ValidRoles

```typescript
// En valid-roles.ts
export enum ValidRoles {
  ADMIN = 'admin',
  SUPER_USER = 'super-user',
  USER = 'user'
}
```

**Type Safety:**
```typescript
// ✅ Type-safe
user.roles = [ValidRoles.ADMIN];

// ❌ Propenso a errores
user.roles = ['admon']; // Typo no detectado
```

Ver más: **[08-roles-rbac.md](./08-roles-rbac.md)**

---

## Tabla en PostgreSQL

Cuando ejecutas la aplicación, TypeORM crea esta tabla:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  roles TEXT[] DEFAULT '{user}'
);
```

**Visualización:**

| id (UUID)                            | email              | password (hash)           | fullName  | isActive | roles         |
| ------------------------------------ | ------------------ | ------------------------- | --------- | -------- | ------------- |
| 550e8400-e29b-41d4-a716-446655440000 | admin@teslo.com    | $2b$10$N9qo8uLOic... | Admin User| true     | {admin}       |
| 7c9e6679-7425-40de-944b-e07fc1f90ae7 | john@example.com   | $2b$10$X8Z9qW...     | John Doe  | true     | {user}        |
| 3f333df6-90a4-4fda-8dd3-9485d27cee36 | inactive@test.com  | $2b$10$Y7A8rV...     | Inactive  | false    | {user}        |

---

## Relaciones (Futuras)

Esta entidad puede extenderse con relaciones:

```typescript
@Entity('users')
export class User {
  // ... campos actuales

  // Relación: Un usuario tiene muchos productos
  @OneToMany(() => Product, product => product.user)
  products: Product[];

  // Relación: Un usuario tiene muchas órdenes
  @OneToMany(() => Order, order => order.user)
  orders: Order[];

  // Timestamps automáticos
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## Ejemplo Completo de Creación

### Registro de Usuario

```typescript
// 1. DTO recibido
const createUserDto = {
  email: "maria@example.com",
  password: "SecurePass123",
  fullName: "María García"
};

// 2. Hash de contraseña
const hashedPassword = bcrypt.hashSync("SecurePass123", 10);
// "$2b$10$K4R5T6Y7U8I9O0P1Q2..."

// 3. Crear instancia de entidad
const user = userRepository.create({
  email: "maria@example.com",
  password: hashedPassword,
  fullName: "María García"
  // isActive → default: true
  // roles → default: ['user']
});

// 4. Guardar en base de datos
await userRepository.save(user);

// 5. Usuario guardado
{
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  email: "maria@example.com",
  password: "$2b$10$K4R5T6Y7U8I9O0P1Q2...",
  fullName: "María García",
  isActive: true,
  roles: ["user"]
}
```

---

## Mejores Prácticas

### ✅ Hacer

```typescript
// 1. Siempre hashear contraseñas
password: bcrypt.hashSync(password, 10)

// 2. No incluir password en respuestas
delete user.password;
// o
return { ...user, password: undefined };

// 3. Validar isActive en JWT Strategy
if (!user.isActive) {
  throw new UnauthorizedException('User is inactive');
}

// 4. Usar enum para roles
user.roles = [ValidRoles.ADMIN];
```

### ❌ Evitar

```typescript
// 1. NUNCA guardar contraseñas en texto plano
password: "MyPassword123" // ❌

// 2. NO retornar password en respuestas
return user; // Incluye password si fue seleccionado ❌

// 3. NO hacer hard delete
await userRepository.delete(id); // ❌

// 4. NO usar strings mágicos para roles
user.roles = ['admon']; // Typo no detectado ❌
```

---

## Seguridad

### select: false
```typescript
// Por defecto NO incluye password
const users = await userRepository.find();
// users = [{ id, email, fullName, ... }]
// password NO está presente ✅
```

### Unique Constraint
```typescript
// Intenta crear usuario con email existente
try {
  await userRepository.save({ email: 'existing@example.com', ... });
} catch (error) {
  // Error: duplicate key value violates unique constraint "UQ_email"
  throw new BadRequestException('Email already exists');
}
```

### isActive Validation
```typescript
// En jwt.strategy.ts
if (!user.isActive) {
  throw new UnauthorizedException('User is inactive, talk with an admin');
}
```

---

## Recursos

- [TypeORM Entity Documentation](https://typeorm.io/entities)
- [PostgreSQL UUID Type](https://www.postgresql.org/docs/current/datatype-uuid.html)
- [PostgreSQL Array Types](https://www.postgresql.org/docs/current/arrays.html)

---

**Siguiente:** [03-registro-usuarios.md](./03-registro-usuarios.md) - Implementación del registro
