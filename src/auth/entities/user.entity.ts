import { Product } from 'src/products/entities';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

// =========================================================================
// ENTIDAD USER - REPRESENTACIÓN DE USUARIOS EN LA BASE DE DATOS
// =========================================================================
// Esta entidad representa la tabla 'users' en PostgreSQL y maneja toda
// la información relacionada con la autenticación y autorización de usuarios
//
// FUNCIONALIDADES:
// - Registro de usuarios con email único
// - Almacenamiento seguro de contraseñas (hasheadas con bcrypt)
// - Sistema de roles para autorización (user, admin, super-admin, etc.)
// - Control de estado activo/inactivo para soft-delete

// DECORADOR @Entity:
// Define que esta clase es una entidad de TypeORM que se mapea a una tabla
// 'users' es el nombre de la tabla en PostgreSQL
@Entity('users')
export class User {
  // =======================================================================
  // ID - CLAVE PRIMARIA UUID
  // =======================================================================
  // @PrimaryGeneratedColumn('uuid') genera automáticamente un UUID v4
  // cuando se crea un nuevo usuario
  //
  // VENTAJAS DE UUID vs AUTO_INCREMENT:
  // ✅ Único globalmente (incluso entre diferentes bases de datos)
  // ✅ No revela información sobre cantidad de registros
  // ✅ Seguro para URLs públicas (no secuencial)
  // ✅ Se puede generar en cliente o servidor
  //
  // EJEMPLO: "550e8400-e29b-41d4-a716-446655440000"
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // =======================================================================
  // EMAIL - IDENTIFICADOR ÚNICO DEL USUARIO
  // =======================================================================
  // El email sirve como username y debe ser único en toda la base de datos
  @Column({
    type: 'text',
    // UNIQUE CONSTRAINT: Garantiza que no existan dos usuarios con el mismo email
    // Si se intenta insertar un email duplicado, PostgreSQL lanzará error 23505
    // Este error se maneja en el helper handleDBExceptions
    unique: true,
  })
  email: string;

  // =======================================================================
  // PASSWORD - CONTRASEÑA HASHEADA
  // =======================================================================
  // ⚠️ IMPORTANTE: NUNCA se almacena la contraseña en texto plano
  //
  // PROCESO DE SEGURIDAD:
  // 1. Usuario envía contraseña en texto plano: "MiPassword123"
  // 2. bcrypt.hashSync() la transforma con salt rounds = 10
  // 3. Se guarda el hash: "$2b$10$abcd1234..."
  // 4. Para verificar login: bcrypt.compareSync(plainPassword, hash)
  //
  // SALT ROUNDS = 10:
  // - Es un balance entre seguridad y rendimiento
  // - Significa que el algoritmo se ejecuta 2^10 = 1024 veces
  // - Cada incremento duplica el tiempo de procesamiento
  // - 10 es el valor recomendado por bcrypt (2023)
  @Column({
    type: 'text',
    select: false, // Excluye la contraseña en consultas normales
  })
  password: string;

  // =======================================================================
  // FULLNAME - NOMBRE COMPLETO DEL USUARIO
  // =======================================================================
  // Almacena el nombre real del usuario para personalización
  // Ejemplo: "Juan Pérez", "María González"
  @Column({
    type: 'text',
  })
  fullName: string;

  // =======================================================================
  // ISACTIVE - ESTADO DEL USUARIO (SOFT DELETE)
  // =======================================================================
  // Control de estado para deshabilitar usuarios sin eliminarlos físicamente
  //
  // SOFT DELETE vs HARD DELETE:
  // - Hard delete: DELETE FROM users WHERE id = '...'
  //   ❌ Pérdida permanente de datos
  //   ❌ No se puede revertir
  //   ❌ Rompe relaciones e historial
  //
  // - Soft delete: UPDATE users SET isActive = false WHERE id = '...'
  //   ✅ Se conservan los datos
  //   ✅ Se puede reactivar el usuario
  //   ✅ Se mantiene historial y relaciones
  //
  // CASOS DE USO:
  // - Usuario solicita eliminación de cuenta (GDPR)
  // - Administrador suspende una cuenta por violación de términos
  // - Usuario quiere tomar un "descanso" de la plataforma
  @Column({
    type: 'bool',
    default: true, // Por defecto, usuarios nuevos están activos
  })
  isActive: boolean;

  // =======================================================================
  // ROLES - SISTEMA DE AUTORIZACIÓN BASADO EN ROLES (RBAC)
  // =======================================================================
  // Array de strings que define los permisos del usuario
  //
  // ROLE-BASED ACCESS CONTROL (RBAC):
  // Permite implementar diferentes niveles de acceso en la aplicación
  //
  // ROLES COMUNES:
  // - 'user': Usuario estándar (acceso básico)
  // - 'admin': Administrador (acceso a panel de administración)
  // - 'super-admin': Super administrador (acceso total)
  // - Roles personalizados: 'seller', 'moderator', 'customer-support', etc.
  //
  // EJEMPLO DE USO CON GUARDS:
  // @UseGuards(AuthGuard, RolesGuard)
  // @Roles('admin', 'super-admin')
  // @Delete('products/:id')
  // deleteProduct() { ... }
  //
  // VENTAJAS DE ARRAY DE ROLES:
  // ✅ Un usuario puede tener múltiples roles simultáneamente
  //    Ejemplo: ['user', 'seller', 'moderator']
  // ✅ Fácil de expandir sin cambiar el esquema de BD
  // ✅ Se puede consultar con operador ANY en PostgreSQL
  //    WHERE 'admin' = ANY(roles)
  //
  // TIPO 'text' CON 'array: true' en PostgreSQL:
  // Crea una columna de tipo text[] (array de texto)
  // Se almacena así: ["user", "admin"]
  @Column({
    type: 'text',
    array: true,
    default: ['user'], // Por defecto, nuevos usuarios tienen rol 'user'
  })
  roles: string[];

  @OneToMany(() => Product, (product) => product.user)
  product: Product;
}
