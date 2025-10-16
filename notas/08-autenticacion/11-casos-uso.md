# Casos de Uso Prácticos

[← Volver al índice](./README.md)

## Introducción

Esta guía muestra implementaciones prácticas del sistema de autenticación en escenarios reales.

---

## 1. Registro de Usuario

### Escenario
Un nuevo usuario se registra en la aplicación.

### Implementación

```typescript
// Frontend
const register = async () => {
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'newuser@example.com',
      password: 'SecurePass123',
      fullName: 'New User'
    })
  });

  const data = await response.json();
  localStorage.setItem('token', data.token);
  // Redirigir a dashboard
};
```

### Respuesta

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

## 2. Login de Usuario

### Escenario
Usuario existente inicia sesión.

### Implementación

```typescript
// Frontend
const login = async (email: string, password: string) => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));

    return data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
```

---

## 3. Verificar Estado de Autenticación

### Escenario
Al cargar la aplicación, verificar si el usuario sigue autenticado.

### Implementación

```typescript
// Frontend - useEffect en App.tsx
useEffect(() => {
  const checkAuth = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/check-auth-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token); // Renovar token
        setUser(data);
        setIsAuthenticated(true);
      } else {
        // Token inválido o expirado
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }
    } catch (error) {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    }
  };

  checkAuth();
}, []);
```

---

## 4. Logout de Usuario

### Escenario
Usuario cierra sesión.

### Implementación (Frontend)

```typescript
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Redirigir a login
  window.location.href = '/login';
};
```

⚠️ **Nota:** En JWT stateless, el logout es solo en el cliente. El token sigue válido hasta que expire.

### Mejora: Blacklist (Backend)

```typescript
// auth.service.ts
private tokenBlacklist = new Set<string>();

logout(token: string) {
  this.tokenBlacklist.add(token);
  return { message: 'Logged out successfully' };
}

// jwt.strategy.ts
async validate(payload: JwtPayload, token: string) {
  if (this.authService.isTokenBlacklisted(token)) {
    throw new UnauthorizedException('Token has been revoked');
  }
  // ...
}
```

---

## 5. Ver Perfil del Usuario

### Escenario
Usuario autenticado ve su perfil.

### Backend

```typescript
@Get('profile')
@Auth()
getProfile(@GetUser() user: User) {
  return user;
}
```

### Frontend

```typescript
const getProfile = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch('http://localhost:3000/api/auth/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const profile = await response.json();
  return profile;
};
```

---

## 6. Crear Producto (Solo Admin)

### Escenario
Solo administradores pueden crear productos.

### Backend

```typescript
@Post()
@Auth(ValidRoles.ADMIN)
create(
  @Body() createProductDto: CreateProductDto,
  @GetUser() user: User
) {
  return this.productsService.create(createProductDto, user);
}
```

### Frontend

```typescript
const createProduct = async (productData) => {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(productData)
    });

    if (response.status === 403) {
      alert('No tienes permisos para crear productos');
      return;
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating product:', error);
  }
};
```

---

## 7. Eliminar Producto (Admin o Super User)

### Escenario
Solo admin o super-user pueden eliminar productos.

### Backend

```typescript
@Delete(':id')
@Auth(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
remove(@Param('id') id: string) {
  return this.productsService.remove(id);
}
```

### Frontend

```typescript
const deleteProduct = async (id: string) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  // Verificar roles en frontend (opcional, backend es definitivo)
  if (!user.roles.includes('admin') && !user.roles.includes('super-user')) {
    alert('No tienes permisos para eliminar productos');
    return;
  }

  const confirmed = confirm('¿Estás seguro de eliminar este producto?');
  if (!confirmed) return;

  try {
    const response = await fetch(`http://localhost:3000/api/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      alert('Producto eliminado correctamente');
    }
  } catch (error) {
    console.error('Error deleting product:', error);
  }
};
```

---

## 8. Actualizar Perfil del Usuario

### Escenario
Usuario actualiza su propio perfil.

### Backend

```typescript
@Patch('profile')
@Auth()
updateProfile(
  @GetUser() user: User,
  @Body() updateUserDto: UpdateUserDto
) {
  return this.authService.updateProfile(user.id, updateUserDto);
}
```

```typescript
async updateProfile(id: string, updateUserDto: UpdateUserDto) {
  const user = await this.userRepository.preload({
    id,
    ...updateUserDto
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  // No permitir cambiar roles o email (solo admin puede)
  delete updateUserDto.roles;
  delete updateUserDto.email;

  await this.userRepository.save(user);
  delete user.password;

  return user;
}
```

### Frontend

```typescript
const updateProfile = async (fullName: string) => {
  const token = localStorage.getItem('token');

  const response = await fetch('http://localhost:3000/api/auth/profile', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ fullName })
  });

  const updatedUser = await response.json();
  localStorage.setItem('user', JSON.stringify(updatedUser));
  return updatedUser;
};
```

---

## 9. Cambiar Contraseña

### Escenario
Usuario autenticado cambia su contraseña.

### Backend

```typescript
@Patch('change-password')
@Auth()
changePassword(
  @GetUser() user: User,
  @Body() changePasswordDto: ChangePasswordDto
) {
  return this.authService.changePassword(user, changePasswordDto);
}
```

```typescript
// change-password.dto.ts
export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @IsString()
  @MinLength(6)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)
  newPassword: string;
}
```

```typescript
// auth.service.ts
async changePassword(user: User, dto: ChangePasswordDto) {
  // Buscar usuario con password
  const userWithPassword = await this.userRepository.findOne({
    where: { id: user.id },
    select: { password: true, id: true }
  });

  // Verificar contraseña actual
  if (!bcrypt.compareSync(dto.currentPassword, userWithPassword.password)) {
    throw new UnauthorizedException('Current password is incorrect');
  }

  // Hashear nueva contraseña
  userWithPassword.password = bcrypt.hashSync(dto.newPassword, 10);
  await this.userRepository.save(userWithPassword);

  return { message: 'Password changed successfully' };
}
```

---

## 10. Listar Usuarios (Solo Admin)

### Escenario
Administrador ve la lista de todos los usuarios.

### Backend

```typescript
@Get('users')
@Auth(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
findAll(@Query() paginationDto: PaginationDto) {
  return this.authService.findAll(paginationDto);
}
```

```typescript
async findAll(paginationDto: PaginationDto) {
  const { limit = 10, offset = 0 } = paginationDto;

  const users = await this.userRepository.find({
    take: limit,
    skip: offset,
    // No incluir password
  });

  return users;
}
```

### Frontend

```typescript
const getUsers = async (page = 0, limit = 10) => {
  const token = localStorage.getItem('token');

  const response = await fetch(
    `http://localhost:3000/api/auth/users?limit=${limit}&offset=${page * limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const users = await response.json();
  return users;
};
```

---

## 11. Desactivar Usuario (Solo Admin)

### Escenario
Administrador desactiva (soft delete) un usuario.

### Backend

```typescript
@Patch('users/:id/deactivate')
@Auth(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
deactivateUser(@Param('id') id: string) {
  return this.authService.deactivateUser(id);
}
```

```typescript
async deactivateUser(id: string) {
  const user = await this.userRepository.findOneBy({ id });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  user.isActive = false;
  await this.userRepository.save(user);

  return { message: 'User deactivated successfully' };
}
```

---

## 12. Asignar Roles a Usuario (Solo Super User)

### Escenario
Super administrador cambia los roles de un usuario.

### Backend

```typescript
@Patch('users/:id/roles')
@Auth(ValidRoles.SUPER_USER)
assignRoles(
  @Param('id') id: string,
  @Body() assignRolesDto: AssignRolesDto
) {
  return this.authService.assignRoles(id, assignRolesDto);
}
```

```typescript
// assign-roles.dto.ts
export class AssignRolesDto {
  @IsArray()
  @IsEnum(ValidRoles, { each: true })
  roles: ValidRoles[];
}
```

```typescript
async assignRoles(id: string, dto: AssignRolesDto) {
  const user = await this.userRepository.findOneBy({ id });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  user.roles = dto.roles;
  await this.userRepository.save(user);

  return user;
}
```

---

## 13. Proteger Rutas en Frontend (React)

### Escenario
Solo usuarios autenticados pueden acceder a ciertas rutas.

### Implementación

```typescript
// ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';

interface Props {
  children: JSX.Element;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.some(role => user.roles?.includes(role))) {
    return <Navigate to="/forbidden" />;
  }

  return children;
};
```

### Uso

```typescript
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rutas protegidas */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Solo admin */}
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute allowedRoles={['admin', 'super-user']}>
              <AdminProducts />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 14. Interceptor de Axios para Token

### Escenario
Adjuntar token automáticamente a todas las peticiones.

### Implementación

```typescript
// api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});

// Interceptor de request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Uso

```typescript
// Ya no necesitas agregar token manualmente
const profile = await api.get('/auth/profile');
const products = await api.get('/products');
```

---

## 15. Refresh Token (Mejora Avanzada)

### Escenario
Token expira en 15 minutos, refresh token en 7 días.

### Backend

```typescript
// Generar ambos tokens en login
login(loginUserDto: LoginUserDto) {
  // ...
  const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
  const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

  return {
    ...user,
    accessToken,
    refreshToken
  };
}

// Endpoint para renovar
@Post('refresh')
refreshToken(@Body('refreshToken') refreshToken: string) {
  try {
    const payload = this.jwtService.verify(refreshToken);
    const newAccessToken = this.jwtService.sign({ id: payload.id }, { expiresIn: '15m' });

    return { accessToken: newAccessToken };
  } catch (error) {
    throw new UnauthorizedException('Invalid refresh token');
  }
}
```

### Frontend

```typescript
// Interceptor para renovar token automáticamente
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post('/auth/refresh', { refreshToken });

        const { accessToken } = response.data;
        localStorage.setItem('token', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
```

---

## Recursos

- [React Router Protected Routes](https://reactrouter.com/en/main/start/tutorial#protected-routes)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [JWT Refresh Token Best Practices](https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/)

---

**Siguiente:** [12-mejores-practicas.md](./12-mejores-practicas.md) - Mejores prácticas de seguridad
