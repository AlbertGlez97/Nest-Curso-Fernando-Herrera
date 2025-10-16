// =========================================================================
// INTERFACE: JwtPayload - ESTRUCTURA DEL PAYLOAD DE JWT
// =========================================================================
// Define la estructura de los datos que se incluyen en el token JWT
//
// =========================================================================
// CONCEPTOS CLAVE
// =========================================================================
//
// 1. JWT (JSON Web Token):
//    - Estructura: header.payload.signature
//    - El payload contiene los "claims" (reclamaciones) del usuario
//    - Es información codificada en Base64 (NO encriptada)
//    - Cualquiera puede decodificar el payload en jwt.io
//    - La seguridad proviene de la firma, no del payload
//
// 2. PAYLOAD VS SIGNATURE:
//    - Payload: Contiene datos del usuario (id, email, roles, etc.)
//    - Signature: Firma criptográfica que garantiza que el payload no fue modificado
//    - Si alguien modifica el payload, la firma no coincidirá
//
// 3. CLAIMS ESTÁNDAR DE JWT:
//    - iss (issuer): Quién emitió el token
//    - sub (subject): Identificador del sujeto (usualmente user id)
//    - aud (audience): Para quién es el token
//    - exp (expiration): Timestamp de expiración
//    - iat (issued at): Timestamp de creación
//    - nbf (not before): Timestamp antes del cual el token no es válido
//    - jti (JWT ID): Identificador único del token
//
// 4. CLAIMS PERSONALIZADOS:
//    - Además de los claims estándar, puedes agregar tus propios datos
//    - En este proyecto: id, email
//    - Podrías agregar: roles, permissions, userName, etc.
//
// 5. ⚠️ SEGURIDAD - QUÉ NO INCLUIR EN EL PAYLOAD:
//    - Contraseñas (nunca, ni hasheadas)
//    - Números de tarjetas de crédito
//    - Información médica sensible
//    - Claves API o secretos
//    - Cualquier dato que no quieras que sea visible públicamente
//
// =========================================================================
// USO EN EL PROYECTO:
// =========================================================================
//
// 1. GENERACIÓN DEL TOKEN (auth.service.ts):
// ```typescript
// private getJwtToken(payload: JwtPayload) {
//   const token = this.jwtService.sign(payload);
//   return token;
// }
//
// // Uso:
// const token = this.getJwtToken({
//   id: user.id,
//   email: user.email
// });
// ```
//
// 2. VALIDACIÓN DEL TOKEN (jwt.strategy.ts):
// ```typescript
// async validate(payload: JwtPayload): Promise<User> {
//   const { id, email } = payload;
//   const user = await this.userRepository.findOneBy({ id });
//   // ...
//   return user;
// }
// ```
//
// =========================================================================
// EJEMPLO DE TOKEN COMPLETO:
// =========================================================================
//
// Token JWT (3 partes separadas por punto):
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDA3MjAwfQ.signature
//
// Decodificación del payload (segunda parte):
// {
//   "id": "550e8400-e29b-41d4-a716-446655440000",
//   "email": "user@example.com",
//   "iat": 1700000000,  // Issued At (agregado automáticamente)
//   "exp": 1700007200   // Expiration (agregado automáticamente)
// }
//
// NOTA: iat y exp son agregados automáticamente por jwtService.sign()
//       basándose en la configuración de signOptions: { expiresIn: '2h' }
//
// =========================================================================
// ¿POR QUÉ UNA INTERFACE?
// =========================================================================
//
// 1. TYPE SAFETY:
//    - TypeScript valida que los datos sean correctos
//    - Previene errores de tipeo (ej: 'emil' en lugar de 'email')
//
// 2. AUTOCOMPLETADO:
//    - El IDE sugiere las propiedades disponibles
//    - Reduce errores al escribir código
//
// 3. DOCUMENTACIÓN:
//    - Sirve como documentación del contrato de datos
//    - Otros desarrolladores saben qué esperar en el payload
//
// 4. REFACTORIZACIÓN:
//    - Si cambias la estructura, TypeScript avisa dónde hay que actualizar
//    - Encuentra todos los usos con "Find All References"
//
// =========================================================================

export interface JwtPayload {
  // =======================================================================
  // ID - IDENTIFICADOR ÚNICO DEL USUARIO
  // =======================================================================
  // UUID del usuario en la base de datos
  //
  // USO PRINCIPAL:
  // - Identificar de forma única al usuario
  // - Buscar el usuario en la BD al validar el token
  // - Es inmutable (no cambia nunca)
  //
  // VENTAJA DE USAR ID EN LUGAR DE EMAIL:
  // - El email podría cambiar si el usuario actualiza su perfil
  // - El ID nunca cambia, por lo que los tokens siguen siendo válidos
  //
  // EJEMPLO:
  // "550e8400-e29b-41d4-a716-446655440000"
  id: string;

  // =======================================================================
  // EMAIL - CORREO ELECTRÓNICO DEL USUARIO
  // =======================================================================
  // Email del usuario para identificación secundaria
  //
  // USO:
  // - Logging y auditoría
  // - Mostrar información del usuario sin consultar la BD
  // - Debugging (saber qué usuario hizo qué)
  //
  // CONSIDERACIÓN:
  // - Si el usuario cambia su email, los tokens antiguos tendrán el email viejo
  // - No es crítico porque usamos el ID para buscar el usuario
  // - El email en el token es solo informativo
  //
  // EJEMPLO:
  // "user@example.com"
  email: string;

  // =======================================================================
  // PROPIEDADES ADICIONALES SUGERIDAS (COMENTADAS)
  // =======================================================================
  // Dependiendo de tus necesidades, podrías agregar:
  //
  // roles?: string[];
  // - Incluir los roles en el token
  // - Ventaja: No necesitas consultar BD para verificar roles
  // - Desventaja: Si cambias los roles, los tokens viejos siguen teniendo los roles antiguos
  // - Solución: Tokens de corta duración (ej: 15 minutos)
  //
  // userName?: string;
  // - Nombre del usuario para personalización
  // - Útil para mostrar "Hola, Juan" sin consultar BD
  //
  // permissions?: string[];
  // - Permisos específicos más granulares que roles
  // - Ejemplo: ['read:users', 'write:products']
  //
  // sessionId?: string;
  // - ID de la sesión para invalidar tokens específicos
  // - Útil para implementar logout en múltiples dispositivos
  //
  // deviceId?: string;
  // - Identificar el dispositivo que generó el token
  // - Útil para seguridad (detectar usos sospechosos)

  //Todo: agregar más datos al payload si es necesario
}
