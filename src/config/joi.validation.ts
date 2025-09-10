/**
 * JOI - LIBRERÍA DE VALIDACIÓN DE ESQUEMAS PARA NODE.JS
 * 
 * Joi es una potente librería de validación de datos que permite:
 * 
 * 1. DEFINIR ESQUEMAS: Crear reglas de validación para objetos, arrays, strings, números, etc.
 * 2. VALIDAR DATOS: Verificar que los datos cumplan con las reglas definidas
 * 3. TRANSFORMAR DATOS: Convertir tipos y aplicar valores por defecto
 * 4. GENERAR ERRORES DESCRIPTIVOS: Proporcionar mensajes claros cuando la validación falla
 * 
 * En este caso, Joi valida las variables de entorno al inicio de la aplicación,
 * asegurando que la configuración sea correcta antes de que la app se ejecute.
 * 
 * Si alguna validación falla, NestJS impedirá que la aplicación se inicie,
 * mostrando un error detallado sobre qué variable de entorno es incorrecta.
 */
import * as Joi from 'joi';

/**
 * ESQUEMA DE VALIDACIÓN PARA VARIABLES DE ENTORNO
 * 
 * Este esquema define las reglas que deben cumplir las variables de entorno
 * de la aplicación. Se ejecuta durante el arranque de la aplicación.
 */
export const JoiValidationSchema = Joi.object({
  // MONGODB: Variable de entorno OBLIGATORIA que contiene la URL de conexión a MongoDB
  // Ejemplo: "mongodb://localhost:27017/nest-pokemon"
  // .string(): Debe ser una cadena de texto
  // .required(): Es obligatoria, la aplicación no arrancará sin ella
  MONGODB: Joi.string().required(),

  // PORT: Puerto en el que se ejecutará el servidor web
  // .number(): Debe ser un número
  // .default(3001): Si no se especifica, usará el puerto 3001 por defecto
  // La aplicación puede funcionar sin esta variable gracias al valor por defecto
  PORT: Joi.number().default(3001),

  // DEFAULT_LIMIT: Límite por defecto para paginación en las consultas de Pokémon
  // .number(): Debe ser un número
  // .default(7): Si no se especifica, usará 7 como límite por defecto
  // Controla cuántos Pokémon se devuelven por página en las consultas GET
  DEFAULT_LIMIT: Joi.number().default(7),
});
