# Flujo Completo de Login

[← Volver al índice](./README.md)

## Visión General

El flujo de login verifica las credenciales del usuario y retorna un token JWT para futuras peticiones autenticadas.

---

## Endpoint de Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}
```

---

## Flujo Paso a Paso

### 1. Cliente Envía Credenciales

```json
{
  "email": "admin@teslo.com",
  "password": "Admin123"
}
```

---

### 2. ValidationPipe Valida DTO

```typescript
export class LoginUserDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)
  password: string;
}
```

**Si hay errores:**
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

---

### 3. Controller Recibe DTO

```typescript
@Post('login')
@ApiResponse({ status: 200, description: 'User logged in successfully' })
@ApiResponse({ status: 401, description: 'Credentials are not valid' })
login(@Body() loginUserDto: LoginUserDto) {
  return this.authService.login(loginUserDto);
}
```

---

### 4. Service Busca Usuario por Email

```typescript
async login(loginUserDto: LoginUserDto) {
  const { email, password } = loginUserDto;

  // Buscar usuario incluyendo password (select: false por defecto)
  const user = await this.userRepository.findOne({
    where: { email },
    select: { email: true, password: true, id: true }
  });

  if (!user) {
    throw new UnauthorizedException('Credentials are not valid (email)');
  }

  // Continuar...
}
```

**Importante:** Usar `select: { email: true, password: true, id: true }` porque `password` tiene `select: false` en la entidad.

---

### 5. Service Compara Contraseñas

```typescript
// Comparar contraseña en texto plano con hash
if (!bcrypt.compareSync(password, user.password)) {
  throw new UnauthorizedException('Credentials are not valid (password)');
}
```

#### Proceso de bcrypt.compareSync()

```
1. Entrada usuario: "Admin123"
2. Hash almacenado: "$2b$10$N9qo8uLOickgx2ZMRZoMye..."

3. bcrypt extrae salt del hash:
   Salt: "$2b$10$N9qo8uLOickgx2ZMRZoMye"

4. bcrypt hashea "Admin123" con el mismo salt:
   Nuevo hash: "$2b$10$N9qo8uLOickgx2ZMRZoMye..."

5. bcrypt compara ambos hashes:
   Hash almacenado === Hash calculado
   ✅ Iguales → return true
   ❌ Diferentes → return false
```

**¿Por qué es seguro?**
- ✅ Timing-safe (mismo tiempo independiente del resultado)
- ✅ Usa el mismo salt (extraído del hash almacenado)
- ✅ Verifica contraseña sin revelar el hash

---

### 6. Service Elimina Password del Objeto

```typescript
delete user.password;
```

**Antes:**
```json
{
  "id": "550e8400-...",
  "email": "admin@teslo.com",
  "password": "$2b$10$N9qo8uLOickgx2ZMRZoMye..."
}
```

**Después:**
```json
{
  "id": "550e8400-...",
  "email": "admin@teslo.com"
}
```

⚠️ **Importante:** Nunca retornar contraseñas (ni siquiera hasheadas) al cliente.

---

### 7. Service Genera JWT Token

```typescript
const token = this.getJwtToken({ id: user.id });

return {
  ...user,
  token
};
```

#### getJwtToken()

```typescript
private getJwtToken(payload: JwtPayload): string {
  const token = this.jwtService.sign(payload);
  return token;
}
```

#### Proceso

```
1. Payload: { id: "550e8400-e29b-41d4-a716-446655440000" }

2. JwtService agrega claims automáticos:
   {
     id: "550e8400-e29b-41d4-a716-446655440000",
     iat: 1709583600, // Issued At (timestamp actual)
     exp: 1709590800  // Expiration (actual + 2 horas)
   }

3. Genera token:
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsImlhdCI6MTcwOTU4MzYwMCwiZXhwIjoxNzA5NTkwODAwfQ.signature
```

Ver más: **[05-jwt.md](./05-jwt.md)**

---

### 8. Respuesta al Cliente

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "admin@teslo.com",
  "fullName": "Admin User",
  "isActive": true,
  "roles": ["admin", "user"],
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Flujo Completo (Diagrama)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CLIENTE ENVÍA CREDENCIALES                                   │
│    POST /api/auth/login                                         │
│    { email: "admin@teslo.com", password: "Admin123" }           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. VALIDATIONPIPE VALIDA DTO                                    │
│    ✅ email es email válido                                     │
│    ✅ password tiene 6+ caracteres                              │
│    ✅ password cumple regex                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. CONTROLLER RECIBE DTO                                        │
│    login(loginUserDto: LoginUserDto)                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. SERVICE BUSCA USUARIO POR EMAIL                              │
│    userRepository.findOne({                                     │
│      where: { email: "admin@teslo.com" },                       │
│      select: { email: true, password: true, id: true }          │
│    })                                                           │
│    ✅ Usuario encontrado                                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. SERVICE COMPARA CONTRASEÑAS                                  │
│    bcrypt.compareSync("Admin123", user.password)                │
│    ✅ Contraseñas coinciden                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. SERVICE ELIMINA PASSWORD                                     │
│    delete user.password                                         │
│    ✅ Password removida del objeto                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. SERVICE GENERA JWT TOKEN                                     │
│    jwtService.sign({ id: user.id })                             │
│    ✅ Token generado: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. RESPUESTA AL CLIENTE                                         │
│    {                                                            │
│      id: "550e8400-...",                                        │
│      email: "admin@teslo.com",                                  │
│      fullName: "Admin User",                                    │
│      roles: ["admin", "user"],                                  │
│      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."           │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Manejo de Errores

### 1. Email No Encontrado

```typescript
if (!user) {
  throw new UnauthorizedException('Credentials are not valid (email)');
}
```

**Respuesta:**
```json
{
  "statusCode": 401,
  "message": "Credentials are not valid (email)",
  "error": "Unauthorized"
}
```

---

### 2. Contraseña Incorrecta

```typescript
if (!bcrypt.compareSync(password, user.password)) {
  throw new UnauthorizedException('Credentials are not valid (password)');
}
```

**Respuesta:**
```json
{
  "statusCode": 401,
  "message": "Credentials are not valid (password)",
  "error": "Unauthorized"
}
```

---

### ⚠️ Mejora de Seguridad

**Mensaje genérico para ambos casos:**

```typescript
// ❌ Revela información
if (!user) throw new UnauthorizedException('Email not found');
if (!bcrypt.compareSync(...)) throw new UnauthorizedException('Wrong password');

// ✅ Genérico (no revela si el email existe)
if (!user || !bcrypt.compareSync(password, user.password)) {
  throw new UnauthorizedException('Credentials are not valid');
}
```

**¿Por qué?**
- ❌ "Email not found" → Atacante sabe que el email no existe
- ✅ "Credentials are not valid" → Atacante no sabe si es email o password

---

## Uso del Token

### 1. Cliente Guarda Token

```javascript
// LocalStorage
localStorage.setItem('token', response.token);

// SessionStorage
sessionStorage.setItem('token', response.token);

// Cookie (HttpOnly)
document.cookie = `token=${response.token}; Secure; HttpOnly`;
```

---

### 2. Cliente Envía Token en Peticiones

```http
GET /api/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```javascript
// Fetch API
fetch('http://localhost:3000/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Axios
axios.get('http://localhost:3000/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

### 3. Servidor Valida Token

```
1. AuthGuard extrae token del header
2. JwtStrategy verifica firma y expiración
3. JwtStrategy ejecuta validate(payload)
4. validate() busca usuario en BD
5. validate() verifica que usuario esté activo
6. Usuario adjuntado a req.user
7. Handler recibe usuario
```

Ver más: **[06-passport.md](./06-passport.md)**

---

## check-auth-status Endpoint

### Propósito

Verificar si el token sigue siendo válido y obtener usuario actualizado (similar a refresh token simplificado).

### Código

```typescript
@Get('check-auth-status')
@Auth()
checkAuthStatus(@GetUser() user: User) {
  return this.authService.checkAuthStatus(user);
}
```

```typescript
checkAuthStatus(user: User) {
  return {
    ...user,
    token: this.getJwtToken({ id: user.id })
  };
}
```

### Uso

```http
GET /api/auth/check-auth-status
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta:**
```json
{
  "id": "550e8400-...",
  "email": "admin@teslo.com",
  "fullName": "Admin User",
  "roles": ["admin", "user"],
  "isActive": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Nuevo token
}
```

**Ventajas:**
- ✅ Verifica que el token sigue válido
- ✅ Obtiene datos actualizados del usuario
- ✅ Renueva el token (extiende sesión)

---

## Ejemplo con cURL

### Login Exitoso

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@teslo.com",
    "password": "Admin123"
  }'
```

**Respuesta:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "admin@teslo.com",
  "fullName": "Admin User",
  "isActive": true,
  "roles": ["admin", "user"],
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Login con Credenciales Incorrectas

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@teslo.com",
    "password": "WrongPassword"
  }'
```

**Respuesta:**
```json
{
  "statusCode": 401,
  "message": "Credentials are not valid (password)",
  "error": "Unauthorized"
}
```

---

### Verificar Auth Status

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:3000/api/auth/check-auth-status \
  -H "Authorization: Bearer $TOKEN"
```

---

## Seguridad

### ✅ Implementado

```typescript
// 1. Contraseñas hasheadas con bcrypt
password: bcrypt.hashSync(password, 10)

// 2. Timing-safe comparison
bcrypt.compareSync(password, user.password)

// 3. Password no retornada
delete user.password;

// 4. JWT firmado con secreto
jwtService.sign(payload) // Usa JWT_SECRET

// 5. Mensajes de error genéricos
throw new UnauthorizedException('Credentials are not valid');

// 6. Validación estricta de email y password
@IsEmail()
@Matches(/regex/)
```

### ⚠️ Mejoras Futuras

- ⏳ Rate limiting (prevenir fuerza bruta)
- ⏳ Captcha después de X intentos fallidos
- ⏳ Two-Factor Authentication (2FA)
- ⏳ Refresh tokens con rotación
- ⏳ Registro de intentos de login fallidos
- ⏳ Bloqueo temporal de cuenta tras múltiples fallos

---

## Mejores Prácticas

### ✅ Hacer

```typescript
// 1. Incluir password explícitamente en select
select: { email: true, password: true, id: true }

// 2. Eliminar password antes de retornar
delete user.password;

// 3. Mensajes de error genéricos
throw new UnauthorizedException('Credentials are not valid');

// 4. Usar bcrypt.compareSync()
bcrypt.compareSync(password, user.password)

// 5. Generar nuevo token inmediatamente
const token = this.getJwtToken({ id: user.id });
```

### ❌ Evitar

```typescript
// 1. NO buscar usuario sin incluir password
findOne({ where: { email } }) // ❌ password no incluido (select: false)

// 2. NO retornar password
return { ...user }; // ❌ Puede incluir password

// 3. NO revelar si email existe
throw new UnauthorizedException('Email not found'); // ❌

// 4. NO comparar contraseñas con ===
if (password === user.password) // ❌ NUNCA

// 5. NO loguear contraseñas
console.log(password); // ❌ Nunca loguear contraseñas
```

---

## Recursos

- [bcrypt npm](https://www.npmjs.com/package/bcrypt)
- [NestJS JWT](https://docs.nestjs.com/security/authentication#jwt-functionality)
- [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Siguiente:** [11-casos-uso.md](./11-casos-uso.md) - Casos de uso prácticos
