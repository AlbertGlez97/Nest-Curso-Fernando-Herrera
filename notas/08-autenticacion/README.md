# 08 - Autenticación y Gestión de Usuarios

## 📚 Índice de Temas

Esta sección está dividida en módulos temáticos para facilitar el aprendizaje:

### 🚀 Inicio Rápido
- **[01-introduccion.md](./01-introduccion.md)** - Introducción y arquitectura del módulo Auth

### 👤 Gestión de Usuarios
- **[02-entidad-user.md](./02-entidad-user.md)** - Entidad User y base de datos
- **[03-registro-usuarios.md](./03-registro-usuarios.md)** - Registro de usuarios con validación

### 🔒 Seguridad
- **[04-bcrypt.md](./04-bcrypt.md)** - Seguridad de contraseñas con bcrypt
- **[05-jwt.md](./05-jwt.md)** - JSON Web Tokens (JWT) explicado
- **[06-passport.md](./06-passport.md)** - Passport.js y estrategias

### 🛡️ Guards y Autorización
- **[07-guards.md](./07-guards.md)** - Guards en NestJS (AuthGuard, UserRoleGuard)
- **[08-roles-rbac.md](./08-roles-rbac.md)** - Sistema de roles (RBAC)

### 🎨 Decoradores
- **[09-decoradores.md](./09-decoradores.md)** - Decoradores personalizados (@GetUser, @Auth, etc.)

### 🔐 Autenticación Completa
- **[10-login-flow.md](./10-login-flow.md)** - Flujo completo de login
- **[11-casos-uso.md](./11-casos-uso.md)** - Casos de uso prácticos
- **[12-mejores-practicas.md](./12-mejores-practicas.md)** - Mejores prácticas de seguridad

---

## 🎯 Rutas de Aprendizaje Recomendadas

### Para Principiantes
```
01-introduccion → 02-entidad-user → 03-registro-usuarios
→ 04-bcrypt → 05-jwt → 10-login-flow
```

### Para Desarrolladores Intermedios
```
05-jwt → 06-passport → 07-guards
→ 08-roles-rbac → 09-decoradores → 11-casos-uso
```

### Para Profundizar en Seguridad
```
04-bcrypt → 05-jwt → 12-mejores-practicas
```

---

## 📖 Recursos Adicionales

### Documentación Oficial
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [NestJS Passport](https://docs.nestjs.com/recipes/passport)
- [Passport.js](http://www.passportjs.org/)
- [JWT.io](https://jwt.io/)

### Seguridad
- [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

---

## 🗂️ Estructura del Proyecto

```
src/auth/
├── auth.module.ts           # Configuración del módulo
├── auth.controller.ts       # Endpoints HTTP (register, login)
├── auth.service.ts          # Lógica de negocio
├── entities/
│   └── user.entity.ts       # Modelo de base de datos
├── dto/
│   ├── create-user.dto.ts   # Validación de registro
│   └── login-user.dto.ts    # Validación de login
├── strategies/
│   └── jwt.strategy.ts      # Estrategia JWT de Passport
├── guards/
│   └── user-role.guard.ts   # Guard para validar roles
├── decorators/
│   ├── get-user.decorator.ts      # Extraer usuario del request
│   ├── role-protected.decorator.ts # Definir roles requeridos
│   └── auth.decorator.ts          # Decorador compuesto (recomendado)
└── interfaces/
    ├── jwt-payload.interface.ts   # Estructura del JWT payload
    └── valid-roles.ts             # Enum de roles válidos
```

---

## ✅ Checklist de Implementación

- [x] Crear entidad User con UUID
- [x] Implementar registro de usuarios
- [x] Hashear contraseñas con bcrypt
- [x] Configurar JWT y Passport
- [x] Crear JWT Strategy
- [x] Implementar login
- [x] Crear AuthGuard para proteger rutas
- [x] Implementar sistema de roles (RBAC)
- [x] Crear UserRoleGuard
- [x] Crear decoradores personalizados
- [x] Implementar check-auth-status (refresh token)
- [x] Documentar con Swagger

---

## 🔄 Flujo General de Autenticación

```
┌─────────────────────────────────────────────────────────┐
│ 1. REGISTRO                                             │
│    POST /api/auth/register                              │
│    → Hashear contraseña con bcrypt                      │
│    → Guardar usuario en BD                              │
│    → Generar JWT token                                  │
│    → Retornar usuario + token                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. LOGIN                                                │
│    POST /api/auth/login                                 │
│    → Buscar usuario por email                           │
│    → Comparar contraseña con bcrypt                     │
│    → Generar JWT token                                  │
│    → Retornar usuario + token                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. PETICIONES PROTEGIDAS                                │
│    GET /api/profile                                     │
│    Header: Authorization: Bearer <token>                │
│    → AuthGuard extrae y valida token                    │
│    → JwtStrategy busca usuario en BD                    │
│    → Usuario se adjunta a req.user                      │
│    → UserRoleGuard valida roles (opcional)              │
│    → Handler recibe usuario                             │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 Conceptos Clave

- **JWT**: Token auto-contenido que no requiere almacenar sesiones
- **bcrypt**: Algoritmo de hashing diseñado específicamente para contraseñas
- **Passport**: Middleware de autenticación modular y extensible
- **Guards**: Middleware de NestJS que decide si una petición puede continuar
- **RBAC**: Role-Based Access Control (control de acceso basado en roles)
- **Decoradores**: Funciones que modifican clases, métodos o propiedades
- **Soft Delete**: Marcar registros como inactivos en lugar de eliminarlos
