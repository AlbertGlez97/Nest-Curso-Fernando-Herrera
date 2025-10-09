// =========================================================================
// BARREL FILE - EXPORTACIONES CENTRALIZADAS DE HELPERS
// =========================================================================
// Este archivo actúa como un "barril" que agrupa y re-exporta múltiples módulos
// Beneficios:
// 1. Imports más limpios: import { fileFilter, fileNamer } from './helpers'
//    En lugar de:
//    import { fileFilter } from './helpers/fileFilter.helper'
//    import { fileNamer } from './helpers/fileNamer.helper'
//
// 2. Punto único de acceso a todos los helpers del módulo
// 3. Facilita agregar más helpers en el futuro sin cambiar los imports

export { fileFilter } from './fileFilter.helper';
export { fileNamer } from './fileNamer.helper';