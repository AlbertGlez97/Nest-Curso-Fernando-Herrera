import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

// =========================================================================
// MANEJO CENTRALIZADO DE ERRORES DE BASE DE DATOS
// =========================================================================
export const handleDBExceptions = (error: any, logger: Logger): never => {
  // ERROR DE VIOLACIÓN DE CONSTRAINT ÚNICO (PostgreSQL):
  // Código 23505 = duplicate key value violates unique constraint
  // Esto ocurre cuando intentamos insertar un title o slug que ya existe
  if (error.code == '23505') {
    // Convertir el error técnico de PostgreSQL en un error HTTP 400 comprensible
    // error.detail contiene información específica sobre qué campo duplicado
    throw new BadRequestException(error.detail);
  }

  // LOGGING PARA ERRORES INESPERADOS:
  // Registrar el error completo en los logs del servidor para debugging
  logger.error(error);

  // ERROR GENÉRICO PARA EL CLIENTE:
  // Para cualquier otro error no manejado específicamente,
  // retornar un error HTTP 500 sin exponer detalles internos
  throw new InternalServerErrorException('Únexpected error, check server logs');
};
