# Passport.js y Estrategias

[← Volver al índice](./README.md)

## ¿Qué es Passport.js?

**Passport.js** es un middleware de autenticación para Node.js extremadamente flexible y modular.

### Características

- 🔌 **Modular** → Usa "estrategias" para diferentes métodos de autenticación
- 🎯 **Simple** → API minimalista y fácil de usar
- 🔄 **Extensible** → Más de 500 estrategias disponibles
- 🏢 **Estándar de la industria** → Usado por millones de aplicaciones

---

## ¿Qué son las Estrategias?

Una **estrategia** define **cómo** autenticar a un usuario.

### Estrategias Populares

| Estrategia       | Paquete              | Uso                              |
| ---------------- | -------------------- | -------------------------------- |
| JWT              | `passport-jwt`       | Autenticación con tokens JWT     |
| Local            | `passport-local`     | Usuario/contraseña (login form)  |
| OAuth Google     | `passport-google-oauth20` | Login con Google            |
| OAuth GitHub     | `passport-github2`   | Login con GitHub                 |
| OAuth Facebook   | `passport-facebook`  | Login con Facebook               |
| SAML             | `passport-saml`      | Single Sign-On empresarial       |

---

## Instalación

```bash
yarn add @nestjs/passport passport passport-jwt
yarn add -D @types/passport-jwt
```

---

## Arquitectura en NestJS

```
┌─────────────────────────────────────────────────────┐
│                   MÓDULO AUTH                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. PassportModule.register({ defaultStrategy: 'jwt' })│
│     └─ Configura Passport en el módulo             │
│                                                     │
│  2. JwtModule.registerAsync({ ... })                │
│     └─ Configura generación/validación de tokens   │
│                                                     │
│  3. JwtStrategy extends PassportStrategy            │
│     └─ Define cómo validar tokens JWT              │
│                                                     │
│  4. AuthGuard('jwt')                                │
│     └─ Guard que ejecuta la estrategia JWT         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## JWT Strategy

### jwt.strategy.ts

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { JwtPayload } from '../interfaces';

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

    if (!user) {
      throw new UnauthorizedException('Token not valid');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive, talk with an admin');
    }

    return user;
  }
}
```

---

## Configuración Explicada

### 1. PassportStrategy(Strategy)

```typescript
export class JwtStrategy extends PassportStrategy(Strategy) {
  // ...
}
```

**¿Qué hace?**
- Extiende la clase base de Passport
- `Strategy` viene de `passport-jwt`
- Convierte esta clase en una estrategia de Passport para NestJS

---

### 2. super() Configuration

```typescript
super({
  secretOrKey: configService.get('JWT_SECRET'),
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
});
```

#### secretOrKey

```typescript
secretOrKey: configService.get('JWT_SECRET')
```

**Propósito:**
- Clave secreta para **verificar la firma** del JWT
- Debe coincidir con la usada para **generar** el token
- Si no coincide → Token inválido

**Proceso:**
```
Token recibido:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyJ9.firma

Passport extrae header + payload:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyJ9

Genera firma con JWT_SECRET:
HMACSHA256(header.payload, JWT_SECRET)

Compara firmas:
firma_recibida === firma_calculada
✅ Iguales → Token válido → Ejecuta validate()
❌ Diferentes → Token inválido → 401 Unauthorized
```

---

#### jwtFromRequest

```typescript
jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
```

**Propósito:**
- Define **dónde buscar** el token JWT

**Opciones disponibles:**

| Método                              | Extrae de                          |
| ----------------------------------- | ---------------------------------- |
| `fromAuthHeaderAsBearerToken()`     | Header `Authorization: Bearer <token>` |
| `fromAuthHeaderWithScheme('Token')` | Header `Authorization: Token <token>` |
| `fromHeader('x-api-key')`           | Header personalizado               |
| `fromUrlQueryParameter('token')`    | Query string `?token=...`          |
| `fromBodyField('token')`            | Body del POST `{ token: '...' }`   |
| `fromExtractors([...])`             | Múltiples extractores (fallback)   |

**En nuestro proyecto:**
```http
GET /api/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 3. validate() Method

```typescript
async validate(payload: JwtPayload): Promise<User> {
  const { id } = payload;

  const user = await this.userRepository.findOneBy({ id });

  if (!user) {
    throw new UnauthorizedException('Token not valid');
  }

  if (!user.isActive) {
    throw new UnauthorizedException('User is inactive');
  }

  return user;
}
```

**¿Cuándo se ejecuta?**
Solo si el token:
- ✅ Tiene firma válida (verificada con JWT_SECRET)
- ✅ No ha expirado (exp > now)

**Flujo:**
```
1. Token válido → Passport decodifica payload
   payload = { id: "550e8400-e29b-41d4-a716-446655440000" }

2. Passport llama a validate(payload)

3. validate() busca usuario en BD
   const user = await userRepository.findOneBy({ id: payload.id });

4. Validaciones adicionales:
   - ¿Usuario existe? → Si no: 401
   - ¿Usuario activo? → Si no: 401

5. Retorna usuario
   return user;

6. Passport adjunta usuario a req.user
   req.user = user;

7. Handler recibe usuario
   @GetUser() user: User
```

---

## Flujo Completo de Autenticación

### Paso a Paso

```
1. CLIENTE ENVÍA PETICIÓN
   ┌────────────────────────────────────────────┐
   │ GET /api/auth/profile                      │
   │ Authorization: Bearer eyJhbGciOiJIUzI1...  │
   └────────────────────────────────────────────┘
                    ↓
2. AUTHGUARD SE ACTIVA
   ┌────────────────────────────────────────────┐
   │ @UseGuards(AuthGuard())                    │
   │ AuthGuard('jwt') busca JwtStrategy         │
   └────────────────────────────────────────────┘
                    ↓
3. PASSPORT EXTRAE TOKEN
   ┌────────────────────────────────────────────┐
   │ jwtFromRequest.fromAuthHeaderAsBearerToken()│
   │ token = "eyJhbGciOiJIUzI1..."              │
   └────────────────────────────────────────────┘
                    ↓
4. PASSPORT VERIFICA FIRMA
   ┌────────────────────────────────────────────┐
   │ jwt.verify(token, JWT_SECRET)              │
   │ ✅ Firma válida                            │
   │ ✅ No expirado (exp > now)                 │
   └────────────────────────────────────────────┘
                    ↓
5. PASSPORT DECODIFICA PAYLOAD
   ┌────────────────────────────────────────────┐
   │ payload = { id: "550e8400-..." }           │
   └────────────────────────────────────────────┘
                    ↓
6. PASSPORT LLAMA A validate()
   ┌────────────────────────────────────────────┐
   │ jwtStrategy.validate(payload)              │
   │   ↓                                        │
   │ 1. Busca usuario en BD                     │
   │ 2. Verifica que exista                     │
   │ 3. Verifica que esté activo                │
   │ 4. Retorna usuario                         │
   └────────────────────────────────────────────┘
                    ↓
7. PASSPORT ADJUNTA USUARIO
   ┌────────────────────────────────────────────┐
   │ req.user = user;                           │
   └────────────────────────────────────────────┘
                    ↓
8. HANDLER RECIBE USUARIO
   ┌────────────────────────────────────────────┐
   │ getProfile(@GetUser() user: User) {        │
   │   return user;                             │
   │ }                                          │
   └────────────────────────────────────────────┘
```

---

## Registro en el Módulo

### auth.module.ts

```typescript
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    // Registra Passport con estrategia por defecto 'jwt'
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Registra JwtModule para generar tokens
    JwtModule.registerAsync({ ... }),

    // Registra TypeORM para acceso a base de datos
    TypeOrmModule.forFeature([User]),
  ],
  providers: [
    AuthService,
    JwtStrategy, // ⚠️ IMPORTANTE: Registrar la estrategia
  ],
  exports: [
    JwtStrategy,
    PassportModule,
    JwtModule,
  ],
})
export class AuthModule {}
```

⚠️ **IMPORTANTE:**
- `JwtStrategy` debe estar en `providers`
- `PassportModule` debe estar en `exports` para otros módulos

---

## Uso de AuthGuard

### Proteger una Ruta

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  @Get('profile')
  @UseGuards(AuthGuard()) // Ejecuta JwtStrategy
  getProfile(@GetUser() user: User) {
    return user;
  }
}
```

### AuthGuard con Estrategia Específica

```typescript
// Por defecto (usa 'jwt' configurado en PassportModule)
@UseGuards(AuthGuard())

// Explícitamente especificar estrategia
@UseGuards(AuthGuard('jwt'))

// Múltiples estrategias (intenta en orden)
@UseGuards(AuthGuard(['jwt', 'api-key']))
```

---

## Estrategias Personalizadas

Puedes crear múltiples estrategias para diferentes casos de uso.

### Ejemplo: API Key Strategy

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-header-strategy';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private readonly apiKeyService: ApiKeyService) {
    super({
      header: 'X-API-KEY',
      param: 'api_key',
    });
  }

  async validate(apiKey: string): Promise<boolean> {
    const isValid = await this.apiKeyService.validateApiKey(apiKey);

    if (!isValid) {
      throw new UnauthorizedException('Invalid API Key');
    }

    return true;
  }
}
```

### Uso

```typescript
@Get('public-api')
@UseGuards(AuthGuard('api-key'))
publicApi() {
  return { message: 'Accessed with API Key' };
}
```

---

## Ventajas de Passport.js

### ✅ Ventajas

1. **Abstracción:** No necesitas implementar toda la lógica de JWT manualmente
2. **Seguridad:** Verifica firma, expiración, y formato automáticamente
3. **Flexibilidad:** Fácil cambiar de JWT a OAuth sin reescribir todo
4. **Estándar:** Patrón conocido por la comunidad
5. **Extensible:** Validaciones personalizadas en `validate()`

### Comparación Sin Passport

```typescript
// ❌ SIN PASSPORT (manual, propenso a errores)
@Get('profile')
async getProfile(@Headers('authorization') auth: string) {
  const token = auth?.split(' ')[1];
  if (!token) throw new UnauthorizedException();

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await this.userRepository.findOneBy({ id: payload.id });
    if (!user || !user.isActive) throw new UnauthorizedException();
    return user;
  } catch (error) {
    throw new UnauthorizedException();
  }
}

// ✅ CON PASSPORT (limpio, automático)
@Get('profile')
@UseGuards(AuthGuard())
getProfile(@GetUser() user: User) {
  return user;
}
```

---

## Errores Comunes

### 1. No Registrar JwtStrategy en providers

```typescript
// ❌ Error
@Module({
  providers: [AuthService],
  // JwtStrategy NO está registrado
})

// ✅ Correcto
@Module({
  providers: [AuthService, JwtStrategy],
})
```

### 2. JWT_SECRET No Configurado

```typescript
// ❌ Error en .env
# JWT_SECRET no definido

// ✅ Correcto
JWT_SECRET=tu_clave_secreta_super_segura_min_32_caracteres
```

### 3. No Exportar PassportModule

```typescript
// ❌ Error (otros módulos no pueden usar AuthGuard)
@Module({
  exports: [AuthService],
})

// ✅ Correcto
@Module({
  exports: [PassportModule, JwtModule, AuthService],
})
```

---

## Mejores Prácticas

### ✅ Hacer

```typescript
// 1. Validar usuario activo en validate()
if (!user.isActive) {
  throw new UnauthorizedException('User is inactive');
}

// 2. Usar ConfigService para JWT_SECRET
constructor(configService: ConfigService) {
  super({
    secretOrKey: configService.get('JWT_SECRET'),
  });
}

// 3. Retornar entidad User completa
return user; // Incluye roles, email, etc.

// 4. Manejar errores específicos
if (!user) throw new UnauthorizedException('Token not valid');
```

### ❌ Evitar

```typescript
// 1. NO hardcodear JWT_SECRET
secretOrKey: 'my-secret' // ❌

// 2. NO retornar solo el ID
return { id: user.id }; // ❌ Guards de roles necesitan más info

// 3. NO omitir validación de isActive
// if (!user.isActive) ... // ❌ Olvidado

// 4. NO usar mensajes de error genéricos
throw new UnauthorizedException(); // ❌ Sin mensaje
```

---

## Recursos

- [Passport.js Documentation](http://www.passportjs.org/)
- [passport-jwt npm](https://www.npmjs.com/package/passport-jwt)
- [NestJS Passport Integration](https://docs.nestjs.com/recipes/passport)
- [List of Passport Strategies](http://www.passportjs.org/packages/)

---

**Siguiente:** [07-guards.md](./07-guards.md) - Guards en NestJS
