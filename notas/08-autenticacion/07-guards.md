# Guards en NestJS

[← Volver al índice](./README.md)

## ¿Qué son los Guards?

Los **Guards** son clases que implementan la interfaz `CanActivate` y determinan si una petición puede **continuar** o debe ser **rechazada**.

### Concepto

```typescript
interface CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>;
}
```

**Pregunta que responden:** ¿Puede esta petición acceder a este recurso?

---

## Tipos de Guards

### 1. AuthGuard (Autenticación)

**Pregunta:** ¿Quién eres?

```typescript
@Get('profile')
@UseGuards(AuthGuard())
getProfile(@GetUser() user: User) {
  return user;
}
```

**Validaciones:**
- ✅ Token JWT válido
- ✅ Firma correcta
- ✅ No expirado
- ✅ Usuario existe en BD
- ✅ Usuario activo

---

### 2. UserRoleGuard (Autorización)

**Pregunta:** ¿Qué puedes hacer?

```typescript
@Delete(':id')
@Auth(ValidRoles.ADMIN)
deleteProduct(@Param('id') id: string) {
  return this.productsService.remove(id);
}
```

**Validaciones:**
- ✅ Usuario tiene al menos uno de los roles requeridos
- ✅ Metadata de roles está presente

---

## Orden de Ejecución

```
1. Middleware
2. Guards ⬅ Aquí estamos
3. Interceptors (before)
4. Pipes
5. Handler (método del controller)
6. Interceptors (after)
7. Exception Filters
```

**Importante:** Guards se ejecutan **antes** que los Pipes y el handler.

---

## AuthGuard de Passport

### Código Básico

```typescript
import { AuthGuard } from '@nestjs/passport';

@Get('private')
@UseGuards(AuthGuard())
privateRoute() {
  return { message: 'Private data' };
}
```

### ¿Qué hace?

```
1. Extrae token del header Authorization
2. Verifica firma con JWT_SECRET
3. Verifica expiración
4. Ejecuta JwtStrategy.validate()
5. Adjunta usuario a req.user
6. Permite acceso ✅

Si algo falla → 401 Unauthorized ❌
```

### Variantes

```typescript
// Estrategia por defecto (jwt)
@UseGuards(AuthGuard())

// Estrategia explícita
@UseGuards(AuthGuard('jwt'))

// Múltiples estrategias (fallback)
@UseGuards(AuthGuard(['jwt', 'api-key']))
```

---

## UserRoleGuard Personalizado

### Código Completo

```typescript
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { META_ROLES } from '../decorators/role-protected.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // 1. Obtener roles requeridos desde metadata
    const validRoles: string[] = this.reflector.get(
      META_ROLES,
      context.getHandler(),
    );

    // 2. Si no hay roles requeridos, permitir acceso
    if (!validRoles || validRoles.length === 0) {
      return true;
    }

    // 3. Obtener usuario del request
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    // 4. Verificar que el usuario exista
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // 5. Verificar si el usuario tiene alguno de los roles requeridos
    for (const role of user.roles) {
      if (validRoles.includes(role)) {
        return true; // ✅ Usuario autorizado
      }
    }

    // 6. Usuario no tiene ningún rol válido
    throw new ForbiddenException(
      `User ${user.fullName} needs a valid role: [${validRoles}]`,
    );
  }
}
```

---

## Análisis Detallado

### 1. Reflector

```typescript
constructor(private readonly reflector: Reflector) {}
```

**¿Qué es?**
- Servicio de NestJS para leer **metadata**
- Metadata = Información adjuntada a clases/métodos con decoradores

**Ejemplo:**
```typescript
// Decorador adjunta metadata
@SetMetadata('roles', ['admin'])
@Get('admin')
adminRoute() {}

// Reflector lee metadata
const roles = this.reflector.get('roles', context.getHandler());
// roles = ['admin']
```

---

### 2. Obtener Roles Requeridos

```typescript
const validRoles: string[] = this.reflector.get(
  META_ROLES,
  context.getHandler(),
);
```

**¿De dónde vienen?**

```typescript
// En role-protected.decorator.ts
export const META_ROLES = 'roles';

export const RoleProtected = (...args: ValidRoles[]) => {
  return SetMetadata(META_ROLES, args);
};

// Uso
@RoleProtected(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
@Get('admin')
adminRoute() {}

// UserRoleGuard lee: ['admin', 'super-user']
```

---

### 3. Si No Hay Roles Requeridos

```typescript
if (!validRoles || validRoles.length === 0) {
  return true;
}
```

**Casos:**
- Ruta sin `@RoleProtected()` → Permite acceso
- Ruta con `@RoleProtected()` pero sin argumentos → Permite acceso

**Ejemplo:**
```typescript
// Sin roles requeridos → Permite acceso
@Get('public')
@UseGuards(AuthGuard(), UserRoleGuard)
publicRoute() {}

// Con roles requeridos → Valida roles
@Get('admin')
@RoleProtected(ValidRoles.ADMIN)
@UseGuards(AuthGuard(), UserRoleGuard)
adminRoute() {}
```

---

### 4. Obtener Usuario del Request

```typescript
const req = context.switchToHttp().getRequest();
const user = req.user;
```

**ExecutionContext:**
```typescript
context.switchToHttp() → Contexto HTTP
  .getRequest() → Objeto Request de Express
    .user → Usuario adjuntado por AuthGuard
```

**Flujo:**
```
1. AuthGuard ejecuta JwtStrategy.validate()
2. JwtStrategy retorna usuario
3. Passport adjunta usuario a req.user
4. UserRoleGuard lee req.user
```

---

### 5. Verificar Usuario Existe

```typescript
if (!user) {
  throw new BadRequestException('User not found');
}
```

**¿Cuándo ocurre?**
- Si `UserRoleGuard` se usa **sin** `AuthGuard`
- Si `AuthGuard` falla pero no lanza error (raro)

**Buena práctica:** Siempre usar ambos guards juntos:
```typescript
@UseGuards(AuthGuard(), UserRoleGuard)
```

---

### 6. Validar Roles (Lógica OR)

```typescript
for (const role of user.roles) {
  if (validRoles.includes(role)) {
    return true; // ✅ Usuario autorizado
  }
}
```

**Lógica:**
- Usuario tiene: `['user', 'admin']`
- Ruta requiere: `['admin', 'super-user']`
- Validación: ¿Tiene 'admin'? ✅ Sí → Autorizado

**Ejemplos:**

| Usuario Roles      | Roles Requeridos        | Resultado |
| ------------------ | ----------------------- | --------- |
| `['admin']`        | `['admin']`             | ✅ Acceso  |
| `['user', 'admin']`| `['admin']`             | ✅ Acceso  |
| `['admin']`        | `['admin', 'super-user']` | ✅ Acceso |
| `['user']`         | `['admin']`             | ❌ Prohibido |
| `['user']`         | `['admin', 'super-user']` | ❌ Prohibido |

---

### 7. Usuario No Autorizado

```typescript
throw new ForbiddenException(
  `User ${user.fullName} needs a valid role: [${validRoles}]`,
);
```

**HTTP Status:** `403 Forbidden`

**Diferencia con 401:**
- `401 Unauthorized` → No autenticado (sin token o token inválido)
- `403 Forbidden` → Autenticado pero sin permisos

---

## Uso Combinado de Guards

### Enfoque Recomendado

```typescript
@Get('admin')
@Auth(ValidRoles.ADMIN)
adminRoute() {
  return { message: 'Admin access' };
}
```

El decorador `@Auth()` aplica **ambos guards**:

```typescript
// En auth.decorator.ts
export function Auth(...roles: ValidRoles[]) {
  return applyDecorators(
    RoleProtected(...roles),
    UseGuards(AuthGuard(), UserRoleGuard),
    // ...
  );
}
```

---

## Guards Globales

### Aplicar a Toda la Aplicación

```typescript
// main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { UserRoleGuard } from './auth/guards/user-role.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Guard global
  app.useGlobalGuards(
    new UserRoleGuard(app.get(Reflector)),
  );

  await app.listen(3000);
}
```

⚠️ **Nota:** Generalmente NO se usan guards de autenticación globalmente, solo en rutas específicas.

---

## Ejemplos Prácticos

### 1. Solo Autenticación

```typescript
// Cualquier usuario autenticado puede acceder
@Get('profile')
@UseGuards(AuthGuard())
getProfile(@GetUser() user: User) {
  return user;
}
```

---

### 2. Autenticación + Role Admin

```typescript
// Solo usuarios con rol 'admin'
@Delete(':id')
@Auth(ValidRoles.ADMIN)
deleteProduct(@Param('id') id: string) {
  return this.productsService.remove(id);
}
```

---

### 3. Múltiples Roles Válidos

```typescript
// Usuarios con rol 'admin' O 'super-user'
@Post('create-admin')
@Auth(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
createAdmin(@Body() dto: CreateUserDto) {
  return this.authService.createAdmin(dto);
}
```

---

### 4. Sin Roles Requeridos (Solo Autenticación)

```typescript
// Usuario autenticado, sin validar roles
@Get('my-orders')
@Auth() // Sin argumentos
getMyOrders(@GetUser() user: User) {
  return this.ordersService.findByUser(user.id);
}
```

---

## Custom Guards

Puedes crear guards personalizados para casos específicos.

### Ejemplo: IpWhitelistGuard

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class IpWhitelistGuard implements CanActivate {
  private readonly whitelist = ['127.0.0.1', '::1'];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;

    if (!this.whitelist.includes(ip)) {
      throw new ForbiddenException(`IP ${ip} is not whitelisted`);
    }

    return true;
  }
}
```

### Uso

```typescript
@Get('admin-panel')
@UseGuards(IpWhitelistGuard, AuthGuard(), UserRoleGuard)
adminPanel() {
  return { message: 'Admin panel' };
}
```

---

## Comparación: Guards vs Middleware

| Característica  | Guards                      | Middleware                  |
| --------------- | --------------------------- | --------------------------- |
| Ejecución       | Después de middleware       | Antes de guards             |
| Acceso a        | ExecutionContext            | Request, Response, Next     |
| Conoce handler  | ✅ Sí (via ExecutionContext)| ❌ No                        |
| Metadata        | ✅ Puede leer con Reflector | ❌ No                        |
| Uso común       | Autenticación, Autorización | Logging, CORS, Body parsing |

---

## Mejores Prácticas

### ✅ Hacer

```typescript
// 1. Usar @Auth() para combinar guards
@Auth(ValidRoles.ADMIN)

// 2. Siempre usar AuthGuard antes de UserRoleGuard
@UseGuards(AuthGuard(), UserRoleGuard)

// 3. Mensajes de error descriptivos
throw new ForbiddenException(`User needs role: [${validRoles}]`);

// 4. Validar que usuario exista
if (!user) throw new BadRequestException('User not found');
```

### ❌ Evitar

```typescript
// 1. NO usar UserRoleGuard sin AuthGuard
@UseGuards(UserRoleGuard) // ❌ user no existe

// 2. NO hardcodear roles
if (user.roles.includes('admin')) // ❌ Usar enum

// 3. NO omitir validación de roles vacíos
// if (!validRoles) ... // ❌ Olvidado

// 4. NO usar 401 para falta de permisos
throw new UnauthorizedException(); // ❌ Usar 403 ForbiddenException
```

---

## Recursos

- [NestJS Guards Documentation](https://docs.nestjs.com/guards)
- [ExecutionContext API](https://docs.nestjs.com/fundamentals/execution-context)
- [Reflector API](https://docs.nestjs.com/fundamentals/execution-context#reflection-and-metadata)

---

**Siguiente:** [08-roles-rbac.md](./08-roles-rbac.md) - Sistema de roles (RBAC)
