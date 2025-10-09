// =========================================================================
// HELPER: GENERADOR DE NOMBRES DE ARCHIVO - NOMBRES ÚNICOS CON UUID
// =========================================================================
// Esta función se ejecuta cuando Multer va a guardar el archivo en disco
// Genera un nombre único para evitar colisiones y problemas de seguridad

import {v4 as uuid} from 'uuid'

// PARÁMETROS:
// - req: La petición HTTP (por si necesitas información adicional)
// - file: El archivo original que subió el usuario
// - callback: Función que retorna el nombre con el que se guardará el archivo
//   callback(error, nombreArchivo) -> callback(null, 'nuevo-nombre.jpg')

export const fileNamer = ( req: Express.Request, file: Express.Multer.File, callback: Function) => {

    // VALIDACIÓN: Verificar que el archivo exista
    // Aunque fileFilter ya validó esto, es buena práctica verificarlo nuevamente
    if(!file) return callback(new Error('File is empty'), false);

    // EXTRACCIÓN DE LA EXTENSIÓN:
    // file.mimetype: tipo MIME del archivo (ej: "image/jpeg")
    // .split('/')[1]: extrae la extensión (ej: "jpeg")
    const fileExtension = file.mimetype.split('/')[1];

    // GENERACIÓN DEL NOMBRE ÚNICO:
    // uuid() genera un identificador único universal, ej: "a3f5c8d9-1234-5678-90ab-cdef12345678"
    // Esto garantiza que:
    // 1. No haya colisiones (dos archivos con el mismo nombre)
    // 2. No se sobrescriban archivos existentes
    // 3. No se pueda predecir el nombre (seguridad)
    //
    // FORMATO FINAL: "a3f5c8d9-1234-5678-90ab-cdef12345678.jpeg"
    const fileName = `${uuid()}.${fileExtension}`

    // callback(null, fileName) -> Le dice a Multer: "Guarda el archivo con este nombre"
    // El primer parámetro null indica que no hay error
    // El segundo parámetro es el nombre final del archivo
    callback(null, fileName)

}