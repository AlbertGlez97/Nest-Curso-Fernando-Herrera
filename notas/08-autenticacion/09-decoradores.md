# Decoradores Personalizados

[← Volver al índice](./README.md)

## ¿Qué son los Decoradores?

Los **decoradores** son funciones que modifican el comportamiento de clases, métodos, propiedades o parámetros.

### Sintaxis

```typescript
@Decorator()
class MiClase {}

@Decorator()
metodo() {}

metodo(@Decorator() parametro: string) {}
```

---

## Tipos de Decoradores en NestJS

| Tipo              | Propósito                           | Ejemplo                    |
| ----------------- | ----------------------------------- | -------------------------- |
| Class Decorator   | Modifica clases                     | `@Controller()`, `@Injectable()` |
| Method Decorator  | Modifica métodos                    | `@Get()`, `@Post()`, `@UseGuards()` |
| Parameter Decorator | Extrae datos de la petición       | `@Body()`, `@Param()`, `@GetUser()` |
| Property Decorator | Modifica propiedades               | `@Column()`, `@PrimaryGeneratedColumn()` |

**En este módulo creamos:**
- ✅ Parameter Decorators (`@GetUser()`, `@RawHeaders()`)
- ✅ Method Decorators (`@RoleProtected()`, `@Auth()`)

---

## 1. @GetUser() - Parameter Decorator

### Propósito

Extrae el usuario del `request.user` sin escribir código repetitivo.

### Código

```typescript
import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new InternalServerErrorException('User not found (request)');
    }

    return data ? user[data] : user;
  },
);
```

---

### Uso

#### Sin Parámetros (Usuario Completo)

```typescript
@Get('profile')
@Auth()
getProfile(@GetUser() user: User) {
  return user;
}

// user = {
//   id: '550e8400-...',
//   email: 'user@example.com',
//   fullName: 'John Doe',
//   roles: ['user'],
//   isActive: true
// }
```

---

#### Con Parámetros (Campo Específico)

```typescript
@Get('email')
@Auth()
getEmail(@GetUser('email') email: string) {
  return { email };
}

// email = 'user@example.com'
```

```typescript
@Get('roles')
@Auth()
getRoles(@GetUser('roles') roles: string[]) {
  return { roles };
}

// roles = ['user', 'admin']
```

---

### Comparación

#### ❌ Sin Decorador

```typescript
@Get('profile')
@Auth()
getProfile(@Req() req: Request) {
  const user = req.user; // Repetitivo
  if (!user) throw new Error(); // Validación manual
  return user;
}
```

#### ✅ Con Decorador

```typescript
@Get('profile')
@Auth()
getProfile(@GetUser() user: User) {
  return user; // Limpio y conciso
}
```

---

## 2. @RawHeaders() - Parameter Decorator

### Propósito

Extrae los headers crudos de la petición HTTP.

### Código

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RawHeaders = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.rawHeaders;
  },
);
```

---

### Uso

```typescript
@Get('headers')
@Auth()
getHeaders(@RawHeaders() rawHeaders: string[]) {
  return { rawHeaders };
}

// rawHeaders = [
//   'Authorization',
//   'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
//   'Content-Type',
//   'application/json',
//   'User-Agent',
//   'Mozilla/5.0...'
// ]
```

---

### req.headers vs req.rawHeaders

#### req.headers (Objeto)

```typescript
@Get('headers-object')
getHeaders(@Headers() headers: Record<string, string>) {
  return headers;
}

// {
//   "authorization": "Bearer eyJhbGciOiJIUzI1...",
//   "content-type": "application/json",
//   "user-agent": "Mozilla/5.0..."
// }
```

#### req.rawHeaders (Array)

```typescript
@Get('headers-array')
getHeaders(@RawHeaders() rawHeaders: string[]) {
  return rawHeaders;
}

// [
//   "authorization",
//   "Bearer eyJhbGciOiJIUzI1...",
//   "content-type",
//   "application/json",
//   "user-agent",
//   "Mozilla/5.0..."
// ]
```

**Diferencia:** Array = Headers en pares consecutivos [key, value, key, value...]

---

## 3. @RoleProtected() - Method Decorator

### Propósito

Establece metadata indicando qué roles pueden acceder a una ruta.

### Código

```typescript
import { SetMetadata } from '@nestjs/common';
import { ValidRoles } from '../interfaces';

export const META_ROLES = 'roles';

export const RoleProtected = (...args: ValidRoles[]) => {
  return SetMetadata(META_ROLES, args);
};
```

---

### Uso

```typescript
@Delete('products/:id')
@RoleProtected(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
@UseGuards(AuthGuard(), UserRoleGuard)
deleteProduct(@Param('id') id: string) {
  return this.productsService.remove(id);
}
```

---

### ¿Cómo funciona?

```
1. @RoleProtected(ValidRoles.ADMIN)
   ↓
2. SetMetadata('roles', ['admin'])
   ↓
3. Metadata adjuntada al método deleteProduct
   ↓
4. UserRoleGuard ejecuta
   ↓
5. Reflector.get('roles', context.getHandler())
   ↓
6. Lee: ['admin']
   ↓
7. Valida si user.roles incluye 'admin'
```

---

### Limitación

Requiere usar **dos decoradores**:

```typescript
@RoleProtected(ValidRoles.ADMIN) // Metadata
@UseGuards(AuthGuard(), UserRoleGuard) // Guards
```

**Solución:** Decorador compuesto `@Auth()`

---

## 4. @Auth() - Composite Decorator ⭐

### Propósito

Combina **múltiples decoradores** en uno solo para simplificar el código.

### Código

```typescript
import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRoleGuard } from '../guards/user-role.guard';
import { ValidRoles } from '../interfaces';
import { RoleProtected } from './role-protected.decorator';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

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

---

### Uso

#### Solo Autenticación (Cualquier Rol)

```typescript
@Get('profile')
@Auth()
getProfile(@GetUser() user: User) {
  return user;
}
```

---

#### Con Rol Específico

```typescript
@Delete('products/:id')
@Auth(ValidRoles.ADMIN)
deleteProduct(@Param('id') id: string) {
  return this.productsService.remove(id);
}
```

---

#### Con Múltiples Roles

```typescript
@Post('products')
@Auth(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
createProduct(@Body() dto: CreateProductDto) {
  return this.productsService.create(dto);
}
```

---

### Ventajas

#### ❌ Antes (Enfoque 3)

```typescript
@Delete('products/:id')
@RoleProtected(ValidRoles.ADMIN)
@UseGuards(AuthGuard(), UserRoleGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Forbidden' })
deleteProduct(@Param('id') id: string) {
  return this.productsService.remove(id);
}
```

#### ✅ Después (Con @Auth)

```typescript
@Delete('products/:id')
@Auth(ValidRoles.ADMIN)
deleteProduct(@Param('id') id: string) {
  return this.productsService.remove(id);
}
```

**Beneficios:**
- ✅ Menos código
- ✅ Más legible
- ✅ DRY (Don't Repeat Yourself)
- ✅ Incluye documentación Swagger automáticamente
- ✅ Un solo lugar para modificar comportamiento

---

## applyDecorators()

### ¿Qué hace?

Combina múltiples decoradores en uno solo.

```typescript
applyDecorators(
  Decorator1(),
  Decorator2(),
  Decorator3(),
)
```

**Equivale a:**
```typescript
@Decorator1()
@Decorator2()
@Decorator3()
metodo() {}
```

---

### Ejemplo Personalizado

```typescript
// Crear decorador compuesto
export function PublicRoute() {
  return applyDecorators(
    Get(),
    ApiOkResponse({ description: 'Success' }),
    ApiTags('public'),
  );
}

// Uso
@PublicRoute()
getPublicData() {
  return { data: 'public' };
}
```

---

## createParamDecorator()

### Sintaxis

```typescript
createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    // Lógica para extraer/procesar datos
    return extractedData;
  },
)
```

### Parámetros

#### 1. data

Argumento pasado al decorador.

```typescript
@GetUser('email') // data = 'email'
@GetUser() // data = undefined
```

#### 2. ctx (ExecutionContext)

Contexto de ejecución que provee acceso al request.

```typescript
const req = ctx.switchToHttp().getRequest();
```

---

### Ejemplo: Decorador @GetIp()

```typescript
export const GetIp = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.ip;
  },
);
```

**Uso:**
```typescript
@Get('my-ip')
getMyIp(@GetIp() ip: string) {
  return { ip };
}
```

---

## Comparación de los 3 Enfoques

### Enfoque 1: @SetMetadata()

```typescript
@Delete(':id')
@SetMetadata('roles', ['admin'])
@UseGuards(AuthGuard(), UserRoleGuard)
deleteProduct() {}
```

**Pros:**
- ✅ Directo

**Contras:**
- ❌ String mágico `'roles'`
- ❌ No type-safe
- ❌ Verboso

---

### Enfoque 2: @RoleProtected()

```typescript
@Delete(':id')
@RoleProtected(ValidRoles.ADMIN)
@UseGuards(AuthGuard(), UserRoleGuard)
deleteProduct() {}
```

**Pros:**
- ✅ Type-safe (ValidRoles enum)
- ✅ Más legible

**Contras:**
- ❌ Requiere dos decoradores

---

### Enfoque 3: @Auth() ⭐ (Recomendado)

```typescript
@Delete(':id')
@Auth(ValidRoles.ADMIN)
deleteProduct() {}
```

**Pros:**
- ✅ Type-safe
- ✅ Un solo decorador
- ✅ Incluye Swagger
- ✅ DRY

**Contras:**
- Ninguno significativo

---

## Mejores Prácticas

### ✅ Hacer

```typescript
// 1. Usar @Auth() para rutas protegidas
@Auth(ValidRoles.ADMIN)

// 2. Validar que datos existan en decoradores
if (!user) {
  throw new InternalServerErrorException('User not found');
}

// 3. Proveer parámetros opcionales
return data ? user[data] : user;

// 4. Documentar decoradores con JSDoc
/**
 * Extrae el usuario del request
 * @param data Campo específico del usuario (opcional)
 */
export const GetUser = createParamDecorator(...)

// 5. Usar enums para type-safety
@Auth(ValidRoles.ADMIN) // ✅
```

### ❌ Evitar

```typescript
// 1. NO usar strings mágicos
@SetMetadata('roles', ['admin']) // ❌

// 2. NO omitir validación
const user = req.user; // ❌ Puede ser undefined
return user;

// 3. NO crear decoradores muy específicos
@GetUserEmailLowercase() // ❌ Demasiado específico
// Mejor: @GetUser('email') + transformación manual

// 4. NO mezclar enfoques
@RoleProtected(ValidRoles.ADMIN)
@Auth() // ❌ Redundante
```

---

## Decoradores Útiles Adicionales

### @GetQuery()

```typescript
export const GetQuery = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return data ? req.query[data] : req.query;
  },
);

// Uso
@Get('search')
search(@GetQuery('term') term: string) {
  return this.service.search(term);
}
```

---

### @IsPublic()

```typescript
export const IS_PUBLIC_KEY = 'isPublic';
export const IsPublic = () => SetMetadata(IS_PUBLIC_KEY, true);

// Uso
@Get('public')
@IsPublic() // No requiere autenticación
publicRoute() {
  return { data: 'public' };
}

// En AuthGuard global
if (this.reflector.get(IS_PUBLIC_KEY, context.getHandler())) {
  return true; // Permitir sin autenticación
}
```

---

## Testing de Decoradores

### Ejemplo con @GetUser()

```typescript
describe('GetUser Decorator', () => {
  it('should extract user from request', () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser })
      })
    } as ExecutionContext;

    const result = GetUser(undefined, mockContext);
    expect(result).toEqual(mockUser);
  });

  it('should extract specific field', () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser })
      })
    } as ExecutionContext;

    const result = GetUser('email', mockContext);
    expect(result).toBe('test@example.com');
  });
});
```

---

## Recursos

- [NestJS Custom Decorators](https://docs.nestjs.com/custom-decorators)
- [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [Reflector API](https://docs.nestjs.com/fundamentals/execution-context#reflection-and-metadata)

---

**Siguiente:** [10-login-flow.md](./10-login-flow.md) - Flujo completo de login
