// =========================================================================
// ENUM: ValidRoles - ROLES VÁLIDOS DEL SISTEMA (RBAC)
// =========================================================================
// Define todos los roles disponibles en el sistema de autorización
//
// =========================================================================
// CONCEPTOS CLAVE
// =========================================================================
//
// 1. ENUMS EN TYPESCRIPT:
//    - Enumeraciones que definen un conjunto de constantes nombradas
//    - Proporcionan type-safety (previenen valores inválidos)
//    - Facilitan el autocompletado en el IDE
//    - Evitan errores de tipeo ('admon' vs 'admin')
//
// 2. RBAC (Role-Based Access Control):
//    - Sistema de control de acceso basado en roles
//    - Los usuarios tienen roles que definen sus permisos
//    - Las rutas requieren ciertos roles para acceder
//    - Más simple que ABAC (Attribute-Based Access Control)
//
// 3. JERARQUÍA DE ROLES (COMÚN):
//    - user: Usuario estándar (menos permisos)
//    - admin: Administrador (más permisos)
//    - super-user: Super administrador (todos los permisos)
//
//    IMPORTANTE: En este sistema NO hay jerarquía automática
//    Es decir, 'admin' NO incluye automáticamente permisos de 'user'
//    Cada rol debe ser asignado explícitamente
//
// 4. MÚLTIPLES ROLES:
//    - Un usuario puede tener varios roles: ['user', 'admin']
//    - Esto permite flexibilidad en permisos
//    - La validación es de tipo OR (tiene al menos uno de los roles requeridos)
//
// =========================================================================
// USO EN EL PROYECTO:
// =========================================================================
//
// 1. EN DECORADORES:
// ```typescript
// @Get('admin')
// @Auth(ValidRoles.ADMIN)
// adminRoute() { }
// ```
//
// 2. EN GUARDS:
// ```typescript
// @RoleProtected(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
// @UseGuards(AuthGuard(), UserRoleGuard)
// ```
//
// 3. EN LA BASE DE DATOS:
// ```typescript
// @Column({
//   type: 'text',
//   array: true,
//   default: [ValidRoles.USER] // Rol por defecto
// })
// roles: string[];
// ```
//
// =========================================================================
// VENTAJAS DE USAR ENUM VS STRINGS:
// =========================================================================
//
// SIN ENUM (propenso a errores):
// ```typescript
// @Auth('admon', 'super-user') // Typo: 'admon' en lugar de 'admin'
// ```
//
// CON ENUM (type-safe):
// ```typescript
// @Auth(ValidRoles.ADMIN, ValidRoles.SUPER_USER) // TypeScript valida
// ```
//
// VENTAJAS:
// 1. Type-safety: TypeScript detecta errores en tiempo de compilación
// 2. Autocompletado: El IDE sugiere roles válidos
// 3. Refactorización: Cambiar un rol actualiza todos los usos automáticamente
// 4. Documentación: Los roles válidos están en un solo lugar
// 5. Consistencia: Todos usan los mismos valores
//
// =========================================================================
// AGREGAR NUEVOS ROLES:
// =========================================================================
//
// Para agregar un nuevo rol:
//
// 1. Agregar al enum:
//    MODERATOR = 'moderator',
//
// 2. Actualizar la base de datos si es necesario
//    (TypeORM con synchronize:true lo hace automáticamente)
//
// 3. Usar en decoradores:
//    @Auth(ValidRoles.MODERATOR)
//
// EJEMPLOS DE ROLES ADICIONALES:
// - MODERATOR: Modera contenido (reportes, comentarios)
// - SELLER: Vende productos (gestiona inventario)
// - CUSTOMER_SUPPORT: Soporte al cliente (ve tickets, usuarios)
// - ANALYST: Analiza datos (solo lectura)
// - CONTENT_CREATOR: Crea contenido (blog, videos)
//
// =========================================================================
// MEJORES PRÁCTICAS:
// =========================================================================
//
// 1. NOMBRES CLAROS Y DESCRIPTIVOS:
//    ✅ ADMIN, SUPER_USER, CONTENT_MODERATOR
//    ❌ ADM, SU, CM
//
// 2. USA SNAKE_CASE O PASCALCASE:
//    ✅ SUPER_USER o SuperUser
//    ❌ superUser, super-user (guiones no son válidos en enums)
//
// 3. VALORES EN LOWERCASE:
//    ✅ ADMIN = 'admin'
//    Facilita comparaciones en la BD (case-insensitive)
//
// 4. MANTÉN LOS ROLES SIMPLES:
//    - No hagas roles demasiado específicos
//    - Ejemplo: En lugar de 'CAN_EDIT_USER_PROFILE', usa 'ADMIN'
//    - Los permisos granulares son para sistemas ABAC, no RBAC
//
// 5. DOCUMENTA EL PROPÓSITO DE CADA ROL:
//    - Agrega comentarios explicando qué puede hacer cada rol
//    - Ayuda a nuevos desarrolladores a entender el sistema
//
// =========================================================================

export enum ValidRoles {
  // =======================================================================
  // ADMIN - ADMINISTRADOR
  // =======================================================================
  // Rol de administrador con permisos elevados
  //
  // PERMISOS TÍPICOS:
  // - Gestionar usuarios (crear, editar, eliminar)
  // - Gestionar productos (CRUD completo)
  // - Ver reportes y estadísticas
  // - Configurar parámetros del sistema
  // - Moderar contenido (aprobar, rechazar)
  //
  // RESTRICCIONES:
  // - No puede cambiar configuración crítica del sistema
  // - No puede eliminar otros administradores (solo super-user puede)
  //
  // USO COMÚN:
  // @Auth(ValidRoles.ADMIN)
  // @Delete('products/:id')
  // deleteProduct(@Param('id') id: string) { }
  ADMIN = 'admin',

  // =======================================================================
  // SUPER_USER - SUPER ADMINISTRADOR
  // =======================================================================
  // Rol de super administrador con todos los permisos
  //
  // PERMISOS TÍPICOS:
  // - Todo lo que puede hacer un ADMIN
  // - Cambiar configuración crítica del sistema
  // - Gestionar otros administradores
  // - Acceder a logs del sistema
  // - Ejecutar operaciones peligrosas (backups, migraciones)
  // - Ver información sensible (credenciales, logs de seguridad)
  //
  // IMPORTANTE:
  // - Este rol debe ser limitado a muy pocas personas
  // - Típicamente: Fundador, CTO, DevOps lead
  //
  // USO COMÚN:
  // @Auth(ValidRoles.SUPER_USER)
  // @Post('users/admin')
  // createAdmin(@Body() dto: CreateUserDto) { }
  SUPER_USER = 'super-user',

  // =======================================================================
  // USER - USUARIO ESTÁNDAR
  // =======================================================================
  // Rol de usuario regular del sistema
  //
  // PERMISOS TÍPICOS:
  // - Ver su propio perfil
  // - Editar su propio perfil
  // - Ver productos públicos
  // - Hacer compras
  // - Ver su historial de pedidos
  // - Escribir reseñas de productos
  //
  // RESTRICCIONES:
  // - No puede ver ni modificar datos de otros usuarios
  // - No puede acceder a panel de administración
  // - No puede eliminar productos o usuarios
  //
  // USO COMÚN:
  // @Auth(ValidRoles.USER)
  // @Get('profile')
  // getMyProfile(@GetUser() user: User) { }
  //
  // NOTA: Este es el rol por defecto asignado a nuevos usuarios
  // Ver: user.entity.ts → roles: { default: [ValidRoles.USER] }
  USER = 'user',

  // =======================================================================
  // ROLES ADICIONALES (EJEMPLOS COMENTADOS)
  // =======================================================================
  // Si tu aplicación crece, podrías agregar roles como:
  //
  // MODERATOR = 'moderator',
  // - Modera contenido generado por usuarios
  // - Aprueba/rechaza publicaciones, reseñas, comentarios
  // - No puede eliminar usuarios, solo suspender temporalmente
  //
  // SELLER = 'seller',
  // - Vende productos en la plataforma
  // - Gestiona su propio inventario
  // - Ve sus propias ventas y estadísticas
  // - No puede ver datos de otros vendedores
  //
  // CUSTOMER_SUPPORT = 'customer-support',
  // - Atiende tickets de soporte
  // - Ve información de usuarios (sin datos sensibles)
  // - Puede emitir reembolsos dentro de límites
  // - No puede eliminar usuarios o productos
  //
  // ANALYST = 'analyst',
  // - Solo lectura en todo el sistema
  // - Accede a dashboards y reportes
  // - Exporta datos para análisis
  // - No puede modificar nada
}
