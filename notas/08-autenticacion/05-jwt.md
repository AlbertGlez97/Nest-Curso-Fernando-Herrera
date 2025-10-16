# JSON Web Tokens (JWT)

[← Volver al índice](./README.md)

## ¿Qué es JWT?

**JWT (JSON Web Token)** es un estándar abierto (RFC 7519) para transmitir información de forma segura entre dos partes como un objeto JSON.

### Características

- 🔓 **Auto-contenido** → Contiene toda la información necesaria
- 🚫 **Stateless** → No requiere almacenar sesiones en el servidor
- ✍️ **Firmado** → Verifica que no fue modificado
- 📦 **Compacto** → Fácil de transmitir en headers HTTP

---

## Anatomía de un JWT

Un JWT tiene **3 partes** separadas por puntos (`.`):

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsImlhdCI6MTcwOTU4MzYwMCwiZXhwIjoxNzA5NTkwODAwfQ.4Z9X8qKqY5z6pQ3wR7nT2mV1cS0dF8gH9jK4lL6pM8n
│                                      │                                                                                                      │
└─ HEADER                              └─ PAYLOAD                                                                                             └─ SIGNATURE
```

---

## 1. Header (Encabezado)

Define el **tipo de token** y el **algoritmo de firma**.

### Estructura

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

| Campo | Valor    | Significado                     |
| ----- | -------- | ------------------------------- |
| `alg` | `HS256`  | Algoritmo HMAC SHA-256          |
| `typ` | `JWT`    | Tipo de token                   |

### Codificación

```javascript
// JSON
{"alg":"HS256","typ":"JWT"}

// Base64 URL Encoded
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
```

---

## 2. Payload (Carga útil)

Contiene los **claims** (declaraciones) sobre la entidad (usuario).

### Estructura en Nuestro Proyecto

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "iat": 1709583600,
  "exp": 1709590800
}
```

| Campo | Tipo     | Descripción                            |
| ----- | -------- | -------------------------------------- |
| `id`  | string   | UUID del usuario (custom claim)        |
| `iat` | number   | Issued At - Fecha de emisión (timestamp)|
| `exp` | number   | Expiration - Fecha de expiración       |

### Tipos de Claims

#### Registered Claims (Estándar)

| Claim | Nombre        | Descripción                        |
| ----- | ------------- | ---------------------------------- |
| `iss` | Issuer        | Quién emitió el token              |
| `sub` | Subject       | Sujeto del token                   |
| `aud` | Audience      | Destinatario del token             |
| `exp` | Expiration    | Cuándo expira (timestamp)          |
| `iat` | Issued At     | Cuándo fue emitido                 |
| `nbf` | Not Before    | No válido antes de (timestamp)     |
| `jti` | JWT ID        | ID único del token                 |

#### Custom Claims (Personalizados)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "roles": ["admin"]
}
```

⚠️ **IMPORTANTE:** No incluir información sensible (contraseñas, números de tarjeta, etc.)

---

## 3. Signature (Firma)

Garantiza que el token **no fue modificado**.

### Generación

```javascript
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

### Proceso

```
1. Toma el header codificado
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9

2. Toma el payload codificado
   eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsImlhdCI6MTcwOTU4MzYwMCwiZXhwIjoxNzA5NTkwODAwfQ

3. Los concatena con un punto
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsImlhdCI6MTcwOTU4MzYwMCwiZXhwIjoxNzA5NTkwODAwfQ

4. Aplica HMAC SHA-256 con el secreto
   HMACSHA256(contenido, JWT_SECRET)

5. Codifica el resultado en Base64
   4Z9X8qKqY5z6pQ3wR7nT2mV1cS0dF8gH9jK4lL6pM8n
```

---

## Configuración en NestJS

### Instalación

```bash
yarn add @nestjs/jwt @nestjs/passport passport passport-jwt
yarn add -D @types/passport-jwt
```

---

### auth.module.ts

```typescript
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,

    // Configuración de JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: '2h' // Token expira en 2 horas
        }
      })
    }),
  ],
  // ...
})
export class AuthModule {}
```

### Variables de Entorno (.env)

```env
JWT_SECRET=tu_clave_secreta_super_segura_min_32_caracteres
```

⚠️ **Requisitos del JWT_SECRET:**
- Mínimo 32 caracteres
- Aleatorio y complejo
- Diferente en desarrollo y producción
- NUNCA commitear al repositorio

---

## Generación de Token

### En auth.service.ts

```typescript
import { JwtService } from '@nestjs/jwt';

export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  private getJwtToken(payload: JwtPayload): string {
    const token = this.jwtService.sign(payload);
    return token;
  }

  async create(createUserDto: CreateUserDto) {
    // ... crear usuario

    // Generar token
    const token = this.getJwtToken({ id: user.id });

    return {
      ...user,
      token
    };
  }
}
```

### Interface JwtPayload

```typescript
export interface JwtPayload {
  id: string; // UUID del usuario
  // Puedes agregar más campos si es necesario
  // email?: string;
  // roles?: string[];
}
```

---

## Validación de Token

### Proceso Completo

```
1. Cliente envía petición con token
   GET /api/auth/profile
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

2. AuthGuard extrae el token del header

3. JwtStrategy verifica:
   - Firma válida (usando JWT_SECRET)
   - Token no expirado (exp > now)

4. JwtStrategy ejecuta validate(payload):
   - Busca usuario en base de datos
   - Verifica que esté activo (isActive: true)

5. Usuario se adjunta a req.user

6. Handler recibe el usuario
   @GetUser() user: User
```

---

## Expiración de Token

### Configuración

```typescript
JwtModule.registerAsync({
  // ...
  useFactory: () => ({
    secret: process.env.JWT_SECRET,
    signOptions: {
      expiresIn: '2h' // 2 horas
    }
  })
})
```

### Formatos Aceptados

| Formato  | Significado      | Ejemplo      |
| -------- | ---------------- | ------------ |
| `60`     | 60 segundos      | `60`         |
| `"2h"`   | 2 horas          | `"2h"`       |
| `"7d"`   | 7 días           | `"7d"`       |
| `"1m"`   | 1 minuto         | `"1m"`       |
| `"30d"`  | 30 días          | `"30d"`      |

### Recomendaciones

| Tipo de Aplicación | Duración Recomendada |
| ------------------ | -------------------- |
| Banking / Finance  | 15 minutos - 1 hora  |
| E-commerce         | 1 - 4 horas          |
| Social Media       | 1 - 7 días           |
| Admin Dashboard    | 1 - 2 horas          |

⚠️ **Importante:**
- Tokens más cortos = más seguros (menos tiempo de compromiso)
- Tokens más largos = mejor UX (menos logins)
- Usa **refresh tokens** para balancear seguridad y UX

---

## Token en Headers HTTP

### Envío desde Cliente

```http
GET /api/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Formato

```
Authorization: Bearer <token>
│              │      │
│              │      └─ Token JWT
│              └─ Esquema (Bearer)
└─ Header name
```

### Ejemplo con Fetch

```javascript
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

fetch('http://localhost:3000/api/auth/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Ejemplo con Axios

```javascript
const token = localStorage.getItem('token');

axios.get('http://localhost:3000/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## Decodificación vs Validación

### ⚠️ Decodificar NO es Validar

```typescript
// ❌ INSEGURO: Solo decodifica, NO valida firma
import * as jwt from 'jsonwebtoken';
const decoded = jwt.decode(token);
// Cualquiera puede crear un token falso
```

```typescript
// ✅ SEGURO: Decodifica Y valida firma
const decoded = jwt.verify(token, JWT_SECRET);
// Solo tokens firmados con JWT_SECRET son válidos
```

### En Nuestro Proyecto

Passport.js (con JwtStrategy) **automáticamente**:
- ✅ Decodifica el token
- ✅ Verifica la firma
- ✅ Verifica la expiración
- ✅ Ejecuta validate() con el payload

---

## Seguridad

### ✅ Buenas Prácticas

```typescript
// 1. JWT_SECRET fuerte y aleatorio
JWT_SECRET=K8Zp9mN4qR7sT2vW5xY8zB3cD6fG9hJ2

// 2. Expiración razonable
signOptions: { expiresIn: '2h' }

// 3. HTTPS en producción
// Solo transmitir tokens sobre HTTPS

// 4. No incluir datos sensibles
{ id: user.id } // ✅
{ id: user.id, password: user.password } // ❌

// 5. Validar usuario en cada petición
if (!user.isActive) {
  throw new UnauthorizedException('User is inactive');
}
```

### ❌ Errores Comunes

```typescript
// 1. JWT_SECRET débil
JWT_SECRET=secret // ❌ Muy corto

// 2. Sin expiración
signOptions: {} // ❌ Token válido para siempre

// 3. Información sensible en payload
{ password: "hash" } // ❌ Payload es visible

// 4. No validar expiración
jwt.decode(token) // ❌ No verifica exp

// 5. Reutilizar tokens después de logout
// Implementar blacklist o usar refresh tokens
```

---

## JWT vs Sessions

| Característica    | JWT                        | Sessions                    |
| ----------------- | -------------------------- | --------------------------- |
| Almacenamiento    | Cliente (localStorage)     | Servidor (memoria/Redis)    |
| Escalabilidad     | ✅ Fácil (stateless)       | ❌ Compleja (estado compartido) |
| Revocación        | ❌ Difícil (requiere blacklist) | ✅ Fácil (eliminar sesión) |
| Tamaño            | ⚠️ Mayor (200-500 bytes)   | ✅ Menor (cookie pequeña)   |
| Rendimiento       | ✅ Rápido (sin BD)         | ⚠️ Más lento (consulta BD)  |

---

## Herramientas

### jwt.io
Decodifica y verifica tokens JWT online.

**URL:** https://jwt.io/

**Ejemplo:**
1. Pega tu token
2. Ve el header y payload decodificados
3. Pega tu JWT_SECRET para verificar firma

### Extensión de Chrome
- **JWT Debugger** - Decodifica tokens automáticamente en DevTools

---

## Recursos

- [JWT.io](https://jwt.io/)
- [RFC 7519 - JWT Specification](https://tools.ietf.org/html/rfc7519)
- [NestJS JWT Module](https://docs.nestjs.com/security/authentication#jwt-functionality)
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)

---

**Siguiente:** [06-passport.md](./06-passport.md) - Passport.js y estrategias
