# Mejores Prácticas de Seguridad

[← Volver al índice](./README.md)

## Introducción

Esta guía recopila las mejores prácticas de seguridad para sistemas de autenticación y autorización.

---

## 1. Contraseñas

### ✅ Hacer

#### Hashear con bcrypt

```typescript
const hashedPassword = bcrypt.hashSync(password, 10);
```

**¿Por qué?**
- ✅ Algoritmo diseñado específicamente para contraseñas
- ✅ Salt incorporado automáticamente
- ✅ Lento por diseño (dificulta fuerza bruta)
- ✅ Configurable (salt rounds)

---

#### Validación Estricta

```typescript
@IsString()
@MinLength(6)
@MaxLength(50)
@Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)
password: string;
```

**Requisitos:**
- Mínimo 6 caracteres (mejor 8+)
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número o carácter especial

---

#### Salt Rounds Adecuados

```typescript
bcrypt.hashSync(password, 10); // ✅ 2^10 = 1,024 iteraciones
```

| Rounds | Tiempo | Uso                     |
| ------ | ------ | ----------------------- |
| 8      | ~40ms  | Desarrollo              |
| 10     | ~100ms | ✅ Producción (estándar) |
| 12     | ~400ms | Alta seguridad          |
| 14     | ~1.6s  | Máxima seguridad        |

---

### ❌ Evitar

```typescript
// ❌ NUNCA guardar en texto plano
user.password = dto.password;

// ❌ NO usar algoritmos débiles
const hash = crypto.createHash('md5').update(password).digest('hex');
const hash = crypto.createHash('sha1').update(password).digest('hex');

// ❌ NO usar salt rounds muy bajos
bcrypt.hashSync(password, 4); // Inseguro

// ❌ NO permitir contraseñas débiles
@MinLength(1) // Demasiado débil
```

---

## 2. JWT Tokens

### ✅ Hacer

#### Secreto Fuerte

```env
# ✅ Mínimo 32 caracteres, aleatorio
JWT_SECRET=K8Zp9mN4qR7sT2vW5xY8zB3cD6fG9hJ2kL5mN8pQ1rS4tV7wX0yZ3

# Generar con Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

#### Expiración Razonable

```typescript
JwtModule.registerAsync({
  useFactory: () => ({
    secret: process.env.JWT_SECRET,
    signOptions: {
      expiresIn: '2h' // ✅ 2 horas (razonable)
    }
  })
})
```

| Tipo de App        | Duración Recomendada |
| ------------------ | -------------------- |
| Banking/Finance    | 15m - 1h             |
| E-commerce         | 1h - 4h              |
| Social Media       | 1d - 7d              |
| Admin Dashboard    | 1h - 2h              |

---

#### No Incluir Datos Sensibles

```typescript
// ✅ Solo ID del usuario
const payload = { id: user.id };

// ❌ NO incluir datos sensibles
const payload = {
  id: user.id,
  password: user.password, // ❌
  creditCard: user.creditCard, // ❌
  ssn: user.ssn // ❌
};
```

**¿Por qué?**
- JWT es **decodificable** (Base64)
- Cualquiera puede leer el payload
- Solo la firma es segura

---

### ❌ Evitar

```typescript
// ❌ Secreto débil
JWT_SECRET=secret

// ❌ Sin expiración
signOptions: {} // Token válido para siempre

// ❌ Expiración muy larga
expiresIn: '365d' // 1 año es demasiado

// ❌ Hardcodear secreto
secretOrKey: 'my-secret-key'
```

---

## 3. Guards y Autorización

### ✅ Hacer

#### Validar Usuario Activo

```typescript
// En jwt.strategy.ts
async validate(payload: JwtPayload) {
  const user = await this.userRepository.findOneBy({ id: payload.id });

  if (!user) {
    throw new UnauthorizedException('Token not valid');
  }

  if (!user.isActive) {
    throw new UnauthorizedException('User is inactive');
  }

  return user;
}
```

---

#### Usar Decorador @Auth()

```typescript
// ✅ Un solo decorador
@Delete(':id')
@Auth(ValidRoles.ADMIN)
deleteProduct(@Param('id') id: string) {}
```

---

#### Validar Roles en Backend

```typescript
// ✅ Backend es la fuente de verdad
@Injectable()
export class UserRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Validación en backend
    // ...
  }
}
```

---

### ❌ Evitar

```typescript
// ❌ NO confiar solo en validaciones de frontend
// Frontend puede ser manipulado
if (user.role === 'admin') {
  showAdminButton(); // ❌ Insuficiente
}

// ❌ NO omitir validación de isActive
// Usuario desactivado puede seguir usando token viejo

// ❌ NO mezclar enfoques
@SetMetadata('roles', ['admin'])
@RoleProtected(ValidRoles.ADMIN)
@Auth(ValidRoles.ADMIN)
// Elige uno (preferir @Auth)
```

---

## 4. Manejo de Errores

### ✅ Hacer

#### Mensajes Genéricos

```typescript
// ✅ No revela información
if (!user || !bcrypt.compareSync(password, user.password)) {
  throw new UnauthorizedException('Credentials are not valid');
}
```

---

#### Logs Internos Detallados

```typescript
try {
  // ...
} catch (error) {
  this.logger.error(`Login failed for ${email}: ${error.message}`);
  throw new UnauthorizedException('Credentials are not valid');
}
```

---

### ❌ Evitar

```typescript
// ❌ Revela si el email existe
if (!user) {
  throw new UnauthorizedException('Email not found');
}
if (!bcrypt.compareSync(password, user.password)) {
  throw new UnauthorizedException('Password incorrect');
}

// ❌ Expone detalles internos al cliente
throw new Error(error.message);
throw new Error('PostgreSQL error: duplicate key...');
```

---

## 5. HTTPS y Transporte

### ✅ Hacer

#### Usar HTTPS en Producción

```typescript
// main.ts (producción)
const httpsOptions = {
  key: fs.readFileSync('./secrets/private-key.pem'),
  cert: fs.readFileSync('./secrets/public-certificate.pem'),
};

const app = await NestFactory.create(AppModule, { httpsOptions });
```

---

#### Headers de Seguridad

```bash
yarn add helmet
```

```typescript
// main.ts
import helmet from 'helmet';

app.use(helmet());
```

**Headers importantes:**
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Content-Security-Policy`

---

### ❌ Evitar

```typescript
// ❌ HTTP en producción
// Tokens expuestos en texto plano

// ❌ Sin headers de seguridad
// Vulnerable a ataques XSS, clickjacking, etc.
```

---

## 6. Rate Limiting

### ✅ Hacer

#### Limitar Intentos de Login

```bash
yarn add @nestjs/throttler
```

```typescript
// app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60, // 60 segundos
      limit: 5, // 5 peticiones por minuto
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

```typescript
// auth.controller.ts
@Post('login')
@Throttle(3, 60) // 3 intentos por minuto
login(@Body() dto: LoginUserDto) {
  return this.authService.login(dto);
}
```

---

### ❌ Evitar

```typescript
// ❌ Sin rate limiting
// Vulnerable a ataques de fuerza bruta
```

---

## 7. Cookies vs LocalStorage

### LocalStorage

**Ventajas:**
- ✅ Fácil de usar
- ✅ Accesible desde JavaScript

**Desventajas:**
- ❌ Vulnerable a XSS (Cross-Site Scripting)
- ❌ No tiene protección automática

---

### Cookies HttpOnly

**Ventajas:**
- ✅ HttpOnly protege contra XSS
- ✅ Secure flag protege contra MITM
- ✅ SameSite protege contra CSRF

**Desventajas:**
- ⚠️ Más complejo de implementar
- ⚠️ Requiere configuración de CORS adecuada

---

### Implementación con Cookies

```typescript
// auth.controller.ts
@Post('login')
login(
  @Body() dto: LoginUserDto,
  @Res({ passthrough: true }) response: Response
) {
  const result = this.authService.login(dto);

  response.cookie('token', result.token, {
    httpOnly: true,
    secure: true, // Solo HTTPS
    sameSite: 'strict',
    maxAge: 7200000 // 2 horas en ms
  });

  return result;
}
```

---

## 8. Validación de Input

### ✅ Hacer

#### ValidationPipe Global

```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // ✅ Remueve propiedades no definidas en DTO
    forbidNonWhitelisted: true, // ✅ Lanza error si hay propiedades extra
    transform: true, // ✅ Transforma tipos automáticamente
  }),
);
```

---

#### DTOs con Validación Estricta

```typescript
export class CreateUserDto {
  @IsEmail()
  @MaxLength(100)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  fullName: string;
}
```

---

### ❌ Evitar

```typescript
// ❌ Sin validación
async create(data: any) {
  // data puede contener cualquier cosa
}

// ❌ Validación manual
if (!email || !email.includes('@')) {
  throw new Error('Invalid email');
}
```

---

## 9. Logging y Auditoría

### ✅ Hacer

#### Loguear Eventos Importantes

```typescript
// auth.service.ts
async login(dto: LoginUserDto) {
  this.logger.log(`Login attempt for ${dto.email}`);

  const user = await this.findUser(dto.email);

  if (!user) {
    this.logger.warn(`Login failed for ${dto.email}: User not found`);
    throw new UnauthorizedException('Credentials are not valid');
  }

  if (!bcrypt.compareSync(dto.password, user.password)) {
    this.logger.warn(`Login failed for ${dto.email}: Wrong password`);
    throw new UnauthorizedException('Credentials are not valid');
  }

  this.logger.log(`Login successful for ${dto.email}`);
  return { ...user, token: this.getJwtToken({ id: user.id }) };
}
```

---

#### Tabla de Auditoría

```typescript
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  action: string; // 'login', 'logout', 'create_product', etc.

  @Column()
  ip: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

### ❌ Evitar

```typescript
// ❌ NO loguear contraseñas
this.logger.log(`Login attempt: ${dto.email} / ${dto.password}`);

// ❌ NO loguear tokens completos
this.logger.log(`Generated token: ${token}`);

// ❌ Logs insuficientes
// Sin logs es imposible investigar incidentes de seguridad
```

---

## 10. Refresh Tokens

### ✅ Hacer

#### Tokens de Corta Duración + Refresh

```typescript
login(dto: LoginUserDto) {
  const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
  const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

  // Guardar refreshToken en BD para poder revocarlo
  await this.saveRefreshToken(user.id, refreshToken);

  return { accessToken, refreshToken };
}
```

---

#### Rotación de Refresh Tokens

```typescript
@Post('refresh')
async refresh(@Body('refreshToken') refreshToken: string) {
  // Verificar refresh token
  const payload = this.jwtService.verify(refreshToken);

  // Verificar que no esté revocado
  const isValid = await this.isRefreshTokenValid(payload.id, refreshToken);
  if (!isValid) {
    throw new UnauthorizedException('Refresh token has been revoked');
  }

  // Generar nuevo access token
  const newAccessToken = this.jwtService.sign({ id: payload.id }, { expiresIn: '15m' });

  // Rotar refresh token (opcional)
  const newRefreshToken = this.jwtService.sign({ id: payload.id }, { expiresIn: '7d' });
  await this.revokeRefreshToken(payload.id, refreshToken);
  await this.saveRefreshToken(payload.id, newRefreshToken);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
```

---

## 11. Protección CSRF

### ✅ Hacer

#### csurf Middleware

```bash
yarn add csurf cookie-parser
```

```typescript
// main.ts
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';

app.use(cookieParser());
app.use(csurf({ cookie: true }));
```

---

### ❌ Evitar

```typescript
// ❌ Sin protección CSRF con cookies
// Vulnerable a ataques CSRF
```

---

## 12. CORS Configuration

### ✅ Hacer

```typescript
// main.ts
app.enableCors({
  origin: ['https://myapp.com', 'https://www.myapp.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

---

### ❌ Evitar

```typescript
// ❌ Permitir cualquier origen en producción
app.enableCors({
  origin: '*', // Muy permisivo
  credentials: true,
});
```

---

## 13. Variables de Entorno

### ✅ Hacer

```env
# .env
JWT_SECRET=K8Zp9mN4qR7sT2vW5xY8zB3cD6fG9hJ2kL5mN8pQ1rS4tV7wX0yZ3
DB_PASSWORD=SuperSecurePassword123!
```

```gitignore
# .gitignore
.env
.env.local
.env.production
```

```env
# .env.template (commitear este)
JWT_SECRET=your_jwt_secret_here
DB_PASSWORD=your_db_password_here
```

---

### ❌ Evitar

```typescript
// ❌ Hardcodear secretos
const JWT_SECRET = 'my-secret-key';

// ❌ Commitear .env al repositorio
# .gitignore NO tiene .env

// ❌ Usar mismos secretos en dev y prod
```

---

## 14. Dependencias Actualizadas

### ✅ Hacer

```bash
# Verificar vulnerabilidades
yarn audit

# Actualizar dependencias
yarn upgrade

# Usar herramientas automatizadas
yarn add -D npm-check-updates
npx ncu -u
```

---

### ❌ Evitar

```typescript
// ❌ Dependencias desactualizadas
// Pueden tener vulnerabilidades conocidas

// ❌ Ignorar advertencias de yarn audit
```

---

## 15. Two-Factor Authentication (2FA)

### ✅ Hacer (Mejora Futura)

```bash
yarn add speakeasy qrcode
```

```typescript
// Generar secreto 2FA
const secret = speakeasy.generateSecret({ name: 'TesloShop' });

// Verificar código 2FA
const verified = speakeasy.totp.verify({
  secret: user.twoFactorSecret,
  encoding: 'base32',
  token: twoFactorCode,
});
```

---

## Checklist de Seguridad

### Backend

- [ ] ✅ Contraseñas hasheadas con bcrypt (salt rounds >= 10)
- [ ] ✅ JWT con secreto fuerte (>= 32 caracteres)
- [ ] ✅ JWT con expiración razonable (≤ 4 horas para access token)
- [ ] ✅ ValidationPipe global con whitelist y forbidNonWhitelisted
- [ ] ✅ Guards para proteger rutas sensibles
- [ ] ✅ Validar usuario activo en JwtStrategy
- [ ] ✅ Mensajes de error genéricos (no revelan info)
- [ ] ✅ Rate limiting en login y endpoints críticos
- [ ] ✅ HTTPS en producción
- [ ] ✅ Headers de seguridad (helmet)
- [ ] ✅ CORS configurado correctamente
- [ ] ✅ Variables de entorno (no hardcodeadas)
- [ ] ✅ Logging de eventos importantes
- [ ] ✅ Dependencias actualizadas (yarn audit)

### Frontend

- [ ] ✅ Tokens en localStorage o httpOnly cookies
- [ ] ✅ Renovar token antes de expiración
- [ ] ✅ Logout elimina token
- [ ] ✅ Interceptor para adjuntar token automáticamente
- [ ] ✅ Rutas protegidas (ProtectedRoute)
- [ ] ✅ Manejar 401/403 adecuadamente
- [ ] ✅ No confiar solo en validaciones de frontend

---

## Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [NestJS Security](https://docs.nestjs.com/security/authentication)

---

[← Volver al índice](./README.md)
