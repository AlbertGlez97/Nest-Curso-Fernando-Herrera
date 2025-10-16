# Introducción a la Autenticación

[← Volver al índice](./README.md)

## ¿Qué es la Autenticación?

La **autenticación** es el proceso de verificar la identidad de un usuario. Es responder a la pregunta: **"¿Quién eres?"**

### Autenticación vs Autorización

| Concepto       | Pregunta          | Ejemplo                                    |
| -------------- | ----------------- | ------------------------------------------ |
| Autenticación  | ¿Quién eres?      | Login con email/contraseña                 |
| Autorización   | ¿Qué puedes hacer?| Solo admins pueden eliminar productos      |

**Ejemplo práctico:**
```
Usuario: "Soy juan@example.com y mi contraseña es Password123"
Sistema: *Verifica* → Autenticación ✅
Usuario: "Quiero eliminar un producto"
Sistema: *Verifica rol* → ¿Eres admin? → Autorización ✅ o ❌
```

---

## Arquitectura del Módulo Auth

### Componentes Principales

```
┌─────────────────────────────────────────────────┐
│              MÓDULO AUTH                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  📄 auth.controller.ts                          │
│     └─ POST /register                           │
│     └─ POST /login                              │
│     └─ GET /check-auth-status                   │
│                                                 │
│  ⚙️ auth.service.ts                             │
│     └─ create(dto)                              │
│     └─ login(dto)                               │
│     └─ checkAuthStatus(user)                    │
│                                                 │
│  🗄️ user.entity.ts                              │
│     └─ id, email, password, roles, isActive     │
│                                                 │
│  🔐 jwt.strategy.ts                             │
│     └─ validate(payload)                        │
│                                                 │
│  🛡️ user-role.guard.ts                          │
│     └─ canActivate(context)                     │
│                                                 │
│  🎨 Decoradores                                 │
│     └─ @GetUser(), @Auth(), @RoleProtected()    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Flujo de Datos

```
Cliente → Controller → Service → Repository → PostgreSQL
  ↓          ↓           ↓          ↓            ↓
JSON    Validación   Lógica    TypeORM    Tabla users
        con DTO      Negocio   .save()
```

---

## Tecnologías Utilizadas

### Core

| Paquete              | Versión | Propósito                          |
| -------------------- | ------- | ---------------------------------- |
| `@nestjs/passport`   | ^10.0   | Integración de Passport con NestJS |
| `@nestjs/jwt`        | ^10.0   | Manejo de tokens JWT               |
| `passport`           | ^0.7    | Middleware de autenticación        |
| `passport-jwt`       | ^4.0    | Estrategia JWT para Passport       |
| `bcrypt`             | ^5.1    | Hashing de contraseñas             |

### Instalación

```bash
yarn add @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
yarn add -D @types/passport-jwt @types/bcrypt
```

---

## Características del Módulo

### ✅ Implementado

- ✅ **Registro de usuarios** con validaciones estrictas
- ✅ **Contraseñas seguras** hasheadas con bcrypt (10 salt rounds)
- ✅ **Login con JWT** tokens con expiración de 2 horas
- ✅ **Protección de rutas** con AuthGuard de Passport
- ✅ **Sistema de roles** (RBAC: user, admin, super-user)
- ✅ **Guards personalizados** para validación de roles
- ✅ **Decoradores personalizados** (@GetUser, @Auth, @RoleProtected)
- ✅ **Soft delete** con campo isActive
- ✅ **Check auth status** (refresh token simplificado)
- ✅ **Documentación Swagger** completa

### ⏳ Mejoras Futuras

- ⏳ Refresh tokens con rotación
- ⏳ Password reset por email
- ⏳ Two-Factor Authentication (2FA)
- ⏳ Rate limiting para login
- ⏳ Session management (logout en múltiples dispositivos)
- ⏳ OAuth2 (Google, GitHub, etc.)

---

## Flujo de Autenticación Completo

### 1. Registro
```http
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "Password123",
  "fullName": "Juan Pérez"
}

→ Hashear contraseña con bcrypt
→ Guardar en base de datos
→ Generar JWT token
→ Retornar { user, token }
```

### 2. Login
```http
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "Password123"
}

→ Buscar usuario por email
→ Comparar contraseña con bcrypt
→ Generar JWT token
→ Retornar { user, token }
```

### 3. Petición Protegida
```http
GET /api/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

→ AuthGuard extrae token
→ JwtStrategy valida firma
→ JwtStrategy busca usuario
→ Usuario adjuntado a req.user
→ UserRoleGuard valida roles (opcional)
→ Handler recibe usuario
```

---

## Estructura de Archivos

```
src/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── entities/
│   └── user.entity.ts
├── dto/
│   ├── create-user.dto.ts
│   ├── login-user.dto.ts
│   └── index.ts
├── strategies/
│   └── jwt.strategy.ts
├── guards/
│   ├── user-role.guard.ts
│   └── index.ts
├── decorators/
│   ├── get-user.decorator.ts
│   ├── raw-headers.decorator.ts
│   ├── role-protected.decorator.ts
│   ├── auth.decorator.ts
│   └── index.ts
└── interfaces/
    ├── jwt-payload.interface.ts
    ├── valid-roles.ts
    └── index.ts
```

---

## Variables de Entorno

Agregar al archivo `.env`:

```env
# JWT Configuration
JWT_SECRET=tu_clave_secreta_super_segura_min_32_caracteres

# Token expiration (configurado en auth.module.ts)
# 2h por defecto
```

⚠️ **IMPORTANTE:**
- JWT_SECRET debe tener al menos 32 caracteres
- Nunca commitear el archivo `.env`
- Usar diferentes secretos en desarrollo y producción

---

## Endpoints del Módulo

| Método | Ruta                      | Protegida | Descripción                 |
| ------ | ------------------------- | --------- | --------------------------- |
| POST   | /api/auth/register        | No        | Registrar nuevo usuario     |
| POST   | /api/auth/login           | No        | Iniciar sesión              |
| GET    | /api/auth/check-auth-status| Sí       | Verificar token y renovar   |
| GET    | /api/auth/private         | Sí        | Ruta de ejemplo (autenticación) |
| GET    | /api/auth/private2        | Sí + Roles| Ejemplo con @SetMetadata    |
| GET    | /api/auth/private3        | Sí + Roles| Ejemplo con @RoleProtected  |
| GET    | /api/auth/private4        | Sí + Roles| Ejemplo con @Auth (recomendado) |

---

## Próximos Pasos

1. **[Entidad User](./02-entidad-user.md)** - Aprende sobre la estructura de la base de datos
2. **[Registro de Usuarios](./03-registro-usuarios.md)** - Implementa el registro con validaciones
3. **[Seguridad con bcrypt](./04-bcrypt.md)** - Entiende el hashing de contraseñas

---

## Referencias

- [NestJS Authentication Docs](https://docs.nestjs.com/security/authentication)
- [Passport.js](http://www.passportjs.org/)
- [JWT.io](https://jwt.io/)
