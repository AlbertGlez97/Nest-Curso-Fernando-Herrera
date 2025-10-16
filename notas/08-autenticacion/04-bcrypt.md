# Seguridad con bcrypt

[← Volver al índice](./README.md)

## ¿Qué es bcrypt?

**bcrypt** es un algoritmo de hashing diseñado específicamente para contraseñas.

### Características

- 🐌 **Lento por diseño** → Dificulta ataques de fuerza bruta
- 🧂 **Salt incorporado** → Misma contraseña = hashes diferentes
- ⚙️ **Configurable** → Salt rounds ajustables
- 🔒 **Irreversible** → No se puede obtener la contraseña original

---

## Instalación

```bash
yarn add bcrypt
yarn add -D @types/bcrypt
```

---

## Anatomía de un Hash bcrypt

```
$2b$10$N9qo8uLOickgx2ZMRZoMye.fN/K7g4R.RmKlBjH3hnL3MQFZ7qY/S
│  │  │                       │
│  │  │                       └─ Hash (31 caracteres)
│  │  └─────────────────────────Salt (22 caracteres)
│  └────────────────────────────Salt rounds (10)
└───────────────────────────────Algoritmo (2b = bcrypt)
```

### Componentes

| Parte        | Valor | Descripción                                |
| ------------ | ----- | ------------------------------------------ |
| Algoritmo    | `$2b` | Versión de bcrypt                          |
| Salt Rounds  | `10`  | 2^10 = 1,024 iteraciones                   |
| Salt         | 22 chars | Valor aleatorio único                   |
| Hash         | 31 chars | Resultado del proceso de hashing        |

---

## Salt Rounds

El número de salt rounds determina cuántas iteraciones ejecuta el algoritmo.

| Rounds | Iteraciones | Tiempo aprox. | Uso Recomendado               |
| ------ | ----------- | ------------- | ----------------------------- |
| 8      | 256         | ~40ms         | Desarrollo rápido             |
| **10** | **1,024**   | **~100ms**    | **✅ Producción (recomendado)** |
| 12     | 4,096       | ~400ms        | Alta seguridad                |
| 14     | 16,384      | ~1.6s         | Muy alta seguridad (bancos)   |

⚠️ **Importante:** Cada incremento **duplica** el tiempo de procesamiento.

---

## Uso en el Proyecto

### Hashear Contraseña (Registro)

```typescript
import * as bcrypt from 'bcrypt';

// En auth.service.ts
async create(createUserDto: CreateUserDto) {
  const { password, ...userData } = createUserDto;

  const user = this.userRepository.create({
    ...userData,
    password: bcrypt.hashSync(password, 10), // 10 salt rounds
  });

  await this.userRepository.save(user);
  // ...
}
```

**Proceso:**
```
Entrada:  "MyPassword123"
          ↓
bcrypt.hashSync(password, 10)
          ↓
Salida:   "$2b$10$N9qo8uLOickgx2ZMRZoMye.fN/K7g4R..."
```

### Verificar Contraseña (Login)

```typescript
async login(loginUserDto: LoginUserDto) {
  const { email, password } = loginUserDto;

  // Buscar usuario (incluyendo password)
  const user = await this.userRepository.findOne({
    where: { email },
    select: { email: true, password: true, id: true }
  });

  // Comparar contraseñas
  if (!bcrypt.compareSync(password, user.password)) {
    throw new UnauthorizedException('Credentials are not valid');
  }

  // ...
}
```

**Proceso de Comparación:**
```
1. Entrada: "MyPassword123" (texto plano)
2. Hash almacenado: "$2b$10$N9qo8uLOickgx2ZMRZoMye..."
3. bcrypt extrae el salt del hash almacenado
4. bcrypt hashea la entrada con el mismo salt
5. bcrypt compara ambos hashes
6. Retorna: true ✅ o false ❌
```

---

## ¿Por qué NUNCA Guardar Contraseñas en Texto Plano?

### ❌ Riesgos

```typescript
// NUNCA HACER ESTO
{
  email: "user@example.com",
  password: "MyPassword123"  // ❌ Texto plano
}
```

**Consecuencias:**

1. ❌ Si hackean la BD, todas las contraseñas quedan expuestas
2. ❌ Empleados con acceso a BD pueden ver contraseñas
3. ❌ Logs y backups pueden filtrar contraseñas
4. ❌ Ilegal en muchas jurisdicciones (GDPR, CCPA, etc.)
5. ❌ Los usuarios reutilizan contraseñas (compromiso en cascada)

### ✅ Solución: bcrypt

```typescript
// SIEMPRE HACER ESTO
{
  email: "user@example.com",
  password: "$2b$10$N9qo8uLOickgx2ZMRZoMye..."  // ✅ Hash
}
```

**Beneficios:**

1. ✅ Hash irreversible (no se puede obtener la contraseña original)
2. ✅ Cada contraseña tiene salt único
3. ✅ Lento por diseño (dificulta fuerza bruta)
4. ✅ Cumple estándares de seguridad (OWASP, NIST)
5. ✅ Protege a los usuarios si hay filtración

---

## Ejemplo Completo

### Registro
```typescript
// Entrada
const createUserDto = {
  email: "john@example.com",
  password: "SecurePass123",
  fullName: "John Doe"
};

// Proceso
const hash = bcrypt.hashSync("SecurePass123", 10);
// "$2b$10$X8Z9qW..."

// Guardar en BD
await userRepository.save({
  email: "john@example.com",
  password: hash,  // Hash, NO texto plano
  fullName: "John Doe"
});
```

### Login
```typescript
// Entrada
const loginDto = {
  email: "john@example.com",
  password: "SecurePass123"
};

// Buscar usuario
const user = await userRepository.findOne({
  where: { email: "john@example.com" },
  select: { password: true, ... }
});
// user.password = "$2b$10$X8Z9qW..."

// Comparar
const isValid = bcrypt.compareSync("SecurePass123", user.password);
// true ✅

const isInvalid = bcrypt.compareSync("WrongPassword", user.password);
// false ❌
```

---

## Mejores Prácticas

### ✅ Hacer

```typescript
// 1. Usar salt rounds >= 10
bcrypt.hashSync(password, 10);

// 2. Nunca loguear contraseñas
console.log(user); // ✅ (password ya es hash)

// 3. Mensajes de error genéricos
throw new UnauthorizedException('Credentials are not valid');
// NO: "Password incorrect" (revela info)

// 4. Ocultar password en respuestas
return {
  ...user,
  password: undefined
};
```

### ❌ Evitar

```typescript
// 1. Salt rounds muy bajos
bcrypt.hashSync(password, 4); // ❌ Muy rápido, inseguro

// 2. Loguear contraseñas
console.log(password); // ❌ Nunca

// 3. Retornar contraseñas (incluso hasheadas)
return { ...user }; // ❌ Incluye password

// 4. Comparar contraseñas con ===
if (password === user.password) // ❌ NUNCA
```

---

## Timing-Safe Comparison

bcrypt.compareSync() es **timing-safe**, lo que significa que toma el mismo tiempo independientemente de si la contraseña es correcta o no.

### ¿Por qué es importante?

```typescript
// ❌ Vulnerable a timing attacks
if (password === storedPassword) {
  // Retorna más rápido si el primer carácter no coincide
}

// ✅ Timing-safe
bcrypt.compareSync(password, storedPassword);
// Siempre toma el mismo tiempo
```

**Timing Attack:** Un atacante mide el tiempo de respuesta para deducir información sobre la contraseña.

---

## Async vs Sync

### Sync (usado en el proyecto)

```typescript
const hash = bcrypt.hashSync(password, 10);
const isValid = bcrypt.compareSync(password, hash);
```

**Pros:**
- ✅ Código más simple
- ✅ Adecuado para carga moderada

**Contras:**
- ⚠️ Bloquea el event loop de Node.js

### Async (recomendado para alta carga)

```typescript
const hash = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, hash);
```

**Pros:**
- ✅ No bloquea el event loop
- ✅ Mejor para aplicaciones con alta concurrencia

**Contras:**
- ⚠️ Código ligeramente más complejo (await)

---

## Recursos

- [bcrypt GitHub](https://github.com/kelektiv/node.bcrypt.js)
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [bcrypt Calculator](https://bcrypt-generator.com/)

---

**Siguiente:** [05-jwt.md](./05-jwt.md) - JSON Web Tokens explicado
