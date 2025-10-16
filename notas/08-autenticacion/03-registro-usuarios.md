# Registro de Usuarios

[← Volver al índice](./README.md)

## Endpoint de Registro

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123",
  "fullName": "Juan Pérez"
}
```

---

## DTO: CreateUserDto

### Código

```typescript
export class CreateUserDto {
  @IsString()
  @IsEmail()
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email (unique)',
    uniqueItems: true
  })
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(
    /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
    {
      message: 'The password must have uppercase, lowercase and a number'
    }
  )
  @ApiProperty({
    example: 'Password123',
    description: 'User password',
    minLength: 6,
    maxLength: 50
  })
  password: string;

  @IsString()
  @MinLength(1)
  @ApiProperty({
    example: 'Juan Pérez',
    description: 'User full name'
  })
  fullName: string;
}
```

---

## Validaciones Detalladas

### Email

```typescript
@IsString()
@IsEmail()
email: string;
```

**Validaciones:**
1. `@IsString()` → Debe ser una cadena de texto
2. `@IsEmail()` → Debe ser un email válido

**Ejemplos:**

| Input                 | Válido | Error                          |
| --------------------- | ------ | ------------------------------ |
| `user@example.com`    | ✅     | -                              |
| `test@gmail.com`      | ✅     | -                              |
| `invalid`             | ❌     | `email must be an email`       |
| `123`                 | ❌     | `email must be an email`       |
| `@example.com`        | ❌     | `email must be an email`       |

---

### Password

```typescript
@IsString()
@MinLength(6)
@MaxLength(50)
@Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)
password: string;
```

**Validaciones:**
1. `@IsString()` → Debe ser una cadena de texto
2. `@MinLength(6)` → Mínimo 6 caracteres
3. `@MaxLength(50)` → Máximo 50 caracteres
4. `@Matches(regex)` → Debe cumplir el patrón de seguridad

#### Regex Explicado

```regex
/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/
```

**Desglose:**

| Parte              | Significado                                    |
| ------------------ | ---------------------------------------------- |
| `(?=.*\d)`         | Lookahead: Al menos un dígito (0-9)            |
| `\|`               | O (OR)                                         |
| `(?=.*\W+)`        | Lookahead: Al menos un carácter especial       |
| `(?![.\n])`        | Negative lookahead: No puede ser solo punto o newline |
| `(?=.*[A-Z])`      | Lookahead: Al menos una mayúscula              |
| `(?=.*[a-z])`      | Lookahead: Al menos una minúscula              |
| `.*$`              | Cualquier carácter hasta el final              |

**Requisitos:**
- ✅ Al menos una letra mayúscula (`A-Z`)
- ✅ Al menos una letra minúscula (`a-z`)
- ✅ Al menos un número (`0-9`) **O** un carácter especial (`!@#$%`, etc.)
- ✅ Mínimo 6 caracteres

**Ejemplos:**

| Password       | Válido | Razón                              |
| -------------- | ------ | ---------------------------------- |
| `Password123`  | ✅     | Tiene mayúscula, minúscula, número |
| `MyPass@2023`  | ✅     | Cumple todos los requisitos        |
| `SecurePass1`  | ✅     | Cumple todos los requisitos        |
| `password123`  | ❌     | Falta mayúscula                    |
| `PASSWORD123`  | ❌     | Falta minúscula                    |
| `PasswordABC`  | ❌     | Falta número o carácter especial   |
| `Pass1`        | ❌     | Menos de 6 caracteres              |

---

### Full Name

```typescript
@IsString()
@MinLength(1)
fullName: string;
```

**Validaciones:**
1. `@IsString()` → Debe ser una cadena de texto
2. `@MinLength(1)` → Al menos 1 carácter

**Ejemplos:**

| Input          | Válido | Error                          |
| -------------- | ------ | ------------------------------ |
| `Juan Pérez`   | ✅     | -                              |
| `A`            | ✅     | -                              |
| `""`           | ❌     | `fullName must be longer than or equal to 1 characters` |
| `123`          | ❌     | `fullName must be a string`    |

---

## Flujo de Registro Completo

### 1. Cliente Envía Petición

```typescript
POST /api/auth/register
{
  "email": "john@example.com",
  "password": "SecurePass123",
  "fullName": "John Doe"
}
```

---

### 2. ValidationPipe Valida DTO

```typescript
// Global ValidationPipe configurado en main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
);
```

**Si hay errores:**
```json
{
  "statusCode": 400,
  "message": [
    "The password must have uppercase, lowercase and a number"
  ],
  "error": "Bad Request"
}
```

---

### 3. Controller Recibe DTO

```typescript
@Post('register')
create(@Body() createUserDto: CreateUserDto) {
  return this.authService.create(createUserDto);
}
```

---

### 4. Service Procesa Registro

```typescript
async create(createUserDto: CreateUserDto) {
  try {
    const { password, ...userData } = createUserDto;

    // 1. Hashear contraseña con bcrypt
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 2. Crear usuario (con roles por defecto)
    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword
    });

    // 3. Guardar en base de datos
    await this.userRepository.save(user);

    // 4. Eliminar password de la respuesta
    delete user.password;

    // 5. Generar JWT token
    const token = this.getJwtToken({ id: user.id });

    // 6. Retornar usuario + token
    return {
      ...user,
      token
    };

  } catch (error) {
    this.handleDBErrors(error);
  }
}
```

---

### 5. Manejo de Errores

```typescript
private handleDBErrors(error: any): never {
  // Error de email duplicado (Unique Constraint)
  if (error.code === '23505') {
    throw new BadRequestException(error.detail);
  }

  // Loguear error interno
  this.logger.error(error);
  throw new InternalServerErrorException('Check server logs');
}
```

**Errores Comunes:**

| Error Code | Tipo                | Causa                        |
| ---------- | ------------------- | ---------------------------- |
| `23505`    | Unique Violation    | Email ya existe              |
| `23502`    | Not Null Violation  | Campo obligatorio faltante   |
| `22001`    | String Too Long     | Texto excede límite          |

---

### 6. Respuesta Exitosa

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "fullName": "John Doe",
  "isActive": true,
  "roles": ["user"],
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Proceso de Hashing (bcrypt)

### Entrada
```typescript
password: "SecurePass123"
```

### Proceso
```typescript
const hashedPassword = bcrypt.hashSync("SecurePass123", 10);
```

**¿Qué hace bcrypt?**
1. Genera un salt aleatorio de 16 bytes
2. Combina el salt con la contraseña
3. Ejecuta el algoritmo 2^10 = 1,024 veces
4. Retorna el hash completo (incluyendo salt)

### Salida
```typescript
password: "$2b$10$N9qo8uLOickgx2ZMRZoMye.fN/K7g4R.RmKlBjH3hnL3MQFZ7qY/S"
         │  │  │                       │
         │  │  │                       └─ Hash (31 caracteres)
         │  │  └─────────────────────────Salt (22 caracteres)
         │  └────────────────────────────Salt rounds (10)
         └───────────────────────────────Algoritmo (2b = bcrypt)
```

Ver más: **[04-bcrypt.md](./04-bcrypt.md)**

---

## Generación de JWT

```typescript
private getJwtToken(payload: JwtPayload): string {
  const token = this.jwtService.sign(payload);
  return token;
}
```

### Payload
```typescript
{ id: "550e8400-e29b-41d4-a716-446655440000" }
```

### Token Generado
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsImlhdCI6MTcwOTU4MzYwMCwiZXhwIjoxNzA5NTkwODAwfQ.signature
│                                      │                                                                                                      │
└─ Header                              └─ Payload (Base64)                                                                                    └─ Signature
```

Ver más: **[05-jwt.md](./05-jwt.md)**

---

## Ejemplo de Uso con cURL

### Registro Exitoso

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123",
    "fullName": "New User"
  }'
```

**Respuesta:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "newuser@example.com",
  "fullName": "New User",
  "isActive": true,
  "roles": ["user"],
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Error: Email Duplicado

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "existing@example.com",
    "password": "SecurePass123",
    "fullName": "Test User"
  }'
```

**Respuesta:**
```json
{
  "statusCode": 400,
  "message": "Key (email)=(existing@example.com) already exists.",
  "error": "Bad Request"
}
```

---

### Error: Validación de Contraseña

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "weak",
    "fullName": "Test User"
  }'
```

**Respuesta:**
```json
{
  "statusCode": 400,
  "message": [
    "password must be longer than or equal to 6 characters",
    "The password must have uppercase, lowercase and a number"
  ],
  "error": "Bad Request"
}
```

---

## Seguridad Implementada

### ✅ Contraseñas Hasheadas
```typescript
// NUNCA se guarda en texto plano
password: bcrypt.hashSync(password, 10)
```

### ✅ Email Único
```typescript
// Constraint en base de datos
@Column('text', { unique: true })
email: string;
```

### ✅ Password No Incluida en Respuesta
```typescript
delete user.password;
return { ...user, token };
```

### ✅ Roles por Defecto
```typescript
// Automáticamente asigna rol 'user'
@Column('text', {
  array: true,
  default: [ValidRoles.USER]
})
roles: string[];
```

### ✅ Validación Estricta de Password
```typescript
// Requiere mayúscula, minúscula, número/especial
@Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)
```

---

## Mejores Prácticas

### ✅ Hacer

```typescript
// 1. Validar con class-validator
@IsEmail()
@Matches(strongPasswordRegex)

// 2. Hashear contraseñas
bcrypt.hashSync(password, 10)

// 3. No retornar password
delete user.password;

// 4. Manejar errores de BD
if (error.code === '23505') {
  throw new BadRequestException('Email already exists');
}

// 5. Generar JWT inmediatamente
const token = this.getJwtToken({ id: user.id });
```

### ❌ Evitar

```typescript
// 1. NO guardar contraseñas en texto plano
password: dto.password // ❌

// 2. NO retornar password
return user; // Puede incluir password ❌

// 3. NO usar validaciones débiles
@MinLength(1) // ❌ Muy débil

// 4. NO exponer detalles internos en errores
throw new Error(error.message); // ❌ Revela info de BD
```

---

## Documentación Swagger

El endpoint está documentado con decoradores:

```typescript
@Post('register')
@ApiResponse({ status: 201, description: 'User successfully created' })
@ApiResponse({ status: 400, description: 'Bad request' })
create(@Body() createUserDto: CreateUserDto) {
  return this.authService.create(createUserDto);
}
```

**Accede a:** `http://localhost:3000/api/docs`

---

## Recursos

- [class-validator GitHub](https://github.com/typestack/class-validator)
- [bcrypt npm](https://www.npmjs.com/package/bcrypt)
- [OWASP Password Recommendations](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#password-length)

---

**Siguiente:** [04-bcrypt.md](./04-bcrypt.md) - Seguridad con bcrypt
