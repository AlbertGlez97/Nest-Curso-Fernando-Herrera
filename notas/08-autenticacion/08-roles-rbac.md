# Sistema de Roles (RBAC)

[← Volver al índice](./README.md)

## ¿Qué es RBAC?

**RBAC (Role-Based Access Control)** es un sistema de control de acceso donde los permisos se asignan a **roles**, y los roles se asignan a **usuarios**.

### Modelo Conceptual

```
Usuario → Roles → Permisos → Recursos
```

**Ejemplo:**
```
Juan → [admin] → [eliminar productos] → Producto #123
María → [user] → [ver productos] → Producto #123
```

---

## RBAC vs ABAC

| Característica | RBAC (Role-Based)          | ABAC (Attribute-Based)    |
| -------------- | -------------------------- | ------------------------- |
| Complejidad    | ✅ Simple                  | ⚠️ Compleja               |
| Granularidad   | ⚠️ Baja (por rol)          | ✅ Alta (por atributos)   |
| Mantenimiento  | ✅ Fácil                   | ⚠️ Difícil                |
| Escalabilidad  | ⚠️ Limitada (muchos roles) | ✅ Muy escalable          |
| Uso común      | Aplicaciones medianas      | Sistemas empresariales    |

**En este proyecto usamos RBAC** por simplicidad y suficiencia para la mayoría de casos.

---

## Roles del Sistema

### ValidRoles Enum

```typescript
export enum ValidRoles {
  ADMIN = 'admin',
  SUPER_USER = 'super-user',
  USER = 'user',
}
```

---

## Definición de Roles

### 1. USER (Usuario Estándar)

**Rol por defecto** para nuevos usuarios.

```typescript
@Column('text', {
  array: true,
  default: [ValidRoles.USER]
})
roles: string[];
```

**Permisos típicos:**
- ✅ Ver su propio perfil
- ✅ Editar su propio perfil
- ✅ Ver productos públicos
- ✅ Hacer compras
- ✅ Ver su historial de pedidos
- ❌ Ver/modificar datos de otros usuarios
- ❌ Crear/eliminar productos
- ❌ Acceder a panel de administración

**Ejemplo:**
```typescript
@Get('my-profile')
@Auth() // Solo autenticado (cualquier rol)
getMyProfile(@GetUser() user: User) {
  return user;
}
```

---

### 2. ADMIN (Administrador)

**Permisos típicos:**
- ✅ Todo lo que puede hacer USER
- ✅ Crear productos
- ✅ Editar productos
- ✅ Eliminar productos
- ✅ Ver lista de usuarios
- ✅ Desactivar usuarios
- ❌ Eliminar otros administradores
- ❌ Cambiar configuración crítica del sistema

**Ejemplo:**
```typescript
@Delete('products/:id')
@Auth(ValidRoles.ADMIN)
deleteProduct(@Param('id') id: string) {
  return this.productsService.remove(id);
}
```

---

### 3. SUPER_USER (Super Administrador)

**Máximo nivel de permisos.**

**Permisos típicos:**
- ✅ Todo lo que puede hacer ADMIN
- ✅ Crear/eliminar otros administradores
- ✅ Cambiar configuración del sistema
- ✅ Acceder a logs del sistema
- ✅ Ejecutar operaciones peligrosas (backups, migraciones)

**Ejemplo:**
```typescript
@Post('users/admin')
@Auth(ValidRoles.SUPER_USER)
createAdmin(@Body() dto: CreateUserDto) {
  return this.authService.createAdmin(dto);
}
```

⚠️ **Importante:** Este rol debe ser limitado a muy pocas personas (CTO, DevOps lead).

---

## Implementación en la Base de Datos

### User Entity

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

### En PostgreSQL

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  password TEXT,
  "fullName" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  roles TEXT[] DEFAULT '{user}'
);
```

**Datos de ejemplo:**

| id   | email              | fullName  | roles                |
| ---- | ------------------ | --------- | -------------------- |
| 1    | admin@teslo.com    | Admin     | {admin}              |
| 2    | super@teslo.com    | Super     | {super-user,admin}   |
| 3    | user@example.com   | Juan      | {user}               |

---

## Asignación de Roles

### Registro (Rol por Defecto)

```typescript
async create(createUserDto: CreateUserDto) {
  const user = this.userRepository.create({
    ...createUserDto,
    password: bcrypt.hashSync(createUserDto.password, 10)
    // roles → default: ['user'] (automático)
  });

  await this.userRepository.save(user);
  return user;
}
```

---

### Asignación Manual (Por Super Admin)

```typescript
@Patch('users/:id/roles')
@Auth(ValidRoles.SUPER_USER)
async assignRoles(
  @Param('id') id: string,
  @Body() dto: AssignRolesDto
) {
  const user = await this.userRepository.findOneBy({ id });
  user.roles = dto.roles; // ['admin', 'user']
  await this.userRepository.save(user);
  return user;
}
```

**DTO:**
```typescript
export class AssignRolesDto {
  @IsArray()
  @IsEnum(ValidRoles, { each: true })
  roles: ValidRoles[];
}
```

---

## Validación de Roles

### UserRoleGuard

```typescript
@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const validRoles: string[] = this.reflector.get(
      META_ROLES,
      context.getHandler(),
    );

    if (!validRoles || validRoles.length === 0) {
      return true; // Sin roles requeridos
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Validación OR: Usuario tiene AL MENOS un rol requerido
    for (const role of user.roles) {
      if (validRoles.includes(role)) {
        return true; // ✅ Autorizado
      }
    }

    throw new ForbiddenException(
      `User ${user.fullName} needs a valid role: [${validRoles}]`,
    );
  }
}
```

---

## Lógica de Validación

### OR Logic (Implementada)

Usuario necesita **AL MENOS UNO** de los roles requeridos.

```typescript
// Ruta requiere: ['admin', 'super-user']
@Auth(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
```

**Validación:**

| Usuario Roles      | Roles Requeridos        | Acceso |
| ------------------ | ----------------------- | ------ |
| `['admin']`        | `['admin', 'super-user']` | ✅ Sí |
| `['super-user']`   | `['admin', 'super-user']` | ✅ Sí |
| `['admin', 'user']`| `['admin', 'super-user']` | ✅ Sí |
| `['user']`         | `['admin', 'super-user']` | ❌ No |

---

### AND Logic (Alternativa NO Implementada)

Usuario necesita **TODOS** los roles requeridos.

```typescript
// Hipotético: Usuario debe tener AMBOS roles
@Auth(ValidRoles.ADMIN, ValidRoles.MODERATOR) // AND logic
```

**Validación:**

| Usuario Roles           | Roles Requeridos          | Acceso |
| ----------------------- | ------------------------- | ------ |
| `['admin', 'moderator']`| `['admin', 'moderator']`  | ✅ Sí |
| `['admin']`             | `['admin', 'moderator']`  | ❌ No |
| `['moderator']`         | `['admin', 'moderator']`  | ❌ No |

⚠️ **En este proyecto usamos OR logic** por ser más flexible.

---

## Decorador @Auth()

### Implementación

```typescript
export function Auth(...roles: ValidRoles[]) {
  return applyDecorators(
    RoleProtected(...roles),
    UseGuards(AuthGuard(), UserRoleGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiForbiddenResponse({ description: 'Forbidden. Token related.' }),
  );
}
```

### Uso

```typescript
// Solo autenticado (cualquier rol)
@Auth()
getProfile() {}

// Solo admin
@Auth(ValidRoles.ADMIN)
deleteProduct() {}

// Admin O super-user
@Auth(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
createAdmin() {}
```

---

## Jerarquía de Roles

### ❌ NO Implementada (Explícita)

En este sistema **NO hay jerarquía automática**:
- `admin` NO incluye permisos de `user`
- `super-user` NO incluye permisos de `admin`

**Ejemplo:**
```typescript
@Auth(ValidRoles.USER)
getUserData() {}

// Usuario con solo rol 'admin' → ❌ Prohibido
// Usuario con roles ['admin', 'user'] → ✅ Permitido
```

---

### ✅ Jerarquía Manual

Si quieres jerarquía, asigna múltiples roles:

```typescript
// Al crear super-admin, asignar todos los roles
user.roles = [ValidRoles.SUPER_USER, ValidRoles.ADMIN, ValidRoles.USER];
```

**Resultado:**
```typescript
@Auth(ValidRoles.USER)
getUserData() {} // ✅ Super-admin puede acceder

@Auth(ValidRoles.ADMIN)
adminPanel() {} // ✅ Super-admin puede acceder

@Auth(ValidRoles.SUPER_USER)
systemConfig() {} // ✅ Super-admin puede acceder
```

---

## Casos de Uso Comunes

### 1. Endpoint Público (Sin Autenticación)

```typescript
@Get('products')
// Sin guards
findAll() {
  return this.productsService.findAll();
}
```

---

### 2. Endpoint Solo Autenticado

```typescript
@Get('my-profile')
@Auth() // Cualquier usuario autenticado
getMyProfile(@GetUser() user: User) {
  return user;
}
```

---

### 3. Endpoint Solo para Admins

```typescript
@Delete('products/:id')
@Auth(ValidRoles.ADMIN)
deleteProduct(@Param('id') id: string) {
  return this.productsService.remove(id);
}
```

---

### 4. Endpoint para Múltiples Roles

```typescript
@Post('products')
@Auth(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
createProduct(@Body() dto: CreateProductDto) {
  return this.productsService.create(dto);
}
```

---

### 5. Endpoint Solo para Super Admin

```typescript
@Delete('users/:id')
@Auth(ValidRoles.SUPER_USER)
deleteUser(@Param('id') id: string) {
  return this.usersService.remove(id);
}
```

---

## Seed Data para Testing

### seed-data.ts

```typescript
const users = [
  {
    email: 'admin@teslo.com',
    password: bcrypt.hashSync('Admin123', 10),
    fullName: 'Admin User',
    roles: [ValidRoles.ADMIN, ValidRoles.USER]
  },
  {
    email: 'super@teslo.com',
    password: bcrypt.hashSync('Super123', 10),
    fullName: 'Super User',
    roles: [ValidRoles.SUPER_USER, ValidRoles.ADMIN, ValidRoles.USER]
  },
  {
    email: 'user@teslo.com',
    password: bcrypt.hashSync('User123', 10),
    fullName: 'Regular User',
    roles: [ValidRoles.USER]
  }
];
```

---

## Mejores Prácticas

### ✅ Hacer

```typescript
// 1. Usar enum para type-safety
@Auth(ValidRoles.ADMIN)

// 2. Principio de mínimo privilegio
// Asignar solo roles necesarios
user.roles = [ValidRoles.USER];

// 3. Validar roles en guards
if (!validRoles.includes(role)) {
  throw new ForbiddenException();
}

// 4. Documentar permisos de cada rol
// En comentarios o archivo README

// 5. Seed users para testing
// admin@teslo.com, super@teslo.com, etc.
```

### ❌ Evitar

```typescript
// 1. NO usar strings mágicos
@Auth('admin') // ❌ Propenso a errores

// 2. NO dar permisos excesivos por defecto
default: [ValidRoles.ADMIN] // ❌

// 3. NO hardcodear validación de roles
if (user.roles.includes('admin')) // ❌ Usar guards

// 4. NO exponer roles en URLs
GET /api/users/admin/123 // ❌ Rol en path

// 5. NO permitir que usuarios cambien sus propios roles
@Patch('my-profile')
updateMyProfile(@Body() dto: UpdateUserDto) {
  // dto NO debe incluir 'roles'
}
```

---

## Extensión del Sistema

### Agregar Nuevo Rol

```typescript
// 1. Agregar al enum
export enum ValidRoles {
  ADMIN = 'admin',
  SUPER_USER = 'super-user',
  USER = 'user',
  MODERATOR = 'moderator', // ⬅ Nuevo
}

// 2. Usar en decoradores
@Auth(ValidRoles.MODERATOR)
moderateContent() {}

// 3. Asignar a usuarios
user.roles = [ValidRoles.MODERATOR, ValidRoles.USER];
```

---

### Permisos Granulares (Futuro)

Si necesitas permisos más específicos, considera **ABAC**:

```typescript
// Ejemplo hipotético con permisos
enum Permissions {
  CREATE_PRODUCT = 'create:product',
  DELETE_PRODUCT = 'delete:product',
  VIEW_USERS = 'view:users',
  EDIT_USERS = 'edit:users',
}

@RequirePermissions(Permissions.DELETE_PRODUCT)
deleteProduct() {}
```

---

## Testing de Roles

### Ejemplo con Jest

```typescript
describe('ProductsController (RBAC)', () => {
  it('should allow admin to delete product', async () => {
    const adminUser = {
      id: '1',
      roles: [ValidRoles.ADMIN]
    };

    const result = await controller.deleteProduct('product-id', adminUser);
    expect(result).toBeDefined();
  });

  it('should deny user to delete product', async () => {
    const regularUser = {
      id: '2',
      roles: [ValidRoles.USER]
    };

    await expect(
      controller.deleteProduct('product-id', regularUser)
    ).rejects.toThrow(ForbiddenException);
  });
});
```

---

## Recursos

- [OWASP RBAC Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [NestJS Guards](https://docs.nestjs.com/guards)
- [PostgreSQL Array Types](https://www.postgresql.org/docs/current/arrays.html)

---

**Siguiente:** [09-decoradores.md](./09-decoradores.md) - Decoradores personalizados
