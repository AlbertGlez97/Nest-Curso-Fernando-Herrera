// =========================================================================
// HELPER: FILTRO DE ARCHIVOS - VALIDACIÓN DE TIPOS DE IMAGEN
// =========================================================================
// Esta función se ejecuta ANTES de que Multer guarde el archivo en disco
// Permite rechazar archivos que no cumplan con los requisitos

// PARÁMETROS:
// - req: La petición HTTP completa (por si necesitas acceder a headers, body, etc.)
// - file: El archivo que el usuario está intentando subir
// - callback: Función que le dice a Multer si acepta o rechaza el archivo
//   callback(error, aceptar) -> callback(null, true) = acepta | callback(null, false) = rechaza

export const fileFilter = ( req: Express.Request, file: Express.Multer.File, callback: Function) => {

    // VALIDACIÓN 1: Verificar que el archivo no esté vacío
    // Si no hay archivo, retorna error inmediatamente
    if(!file) return callback(new Error('File is empty'), false);

    // EXTRACCIÓN DE LA EXTENSIÓN DEL ARCHIVO:
    // file.mimetype contiene el tipo MIME del archivo, ej: "image/jpeg", "image/png", "text/plain"
    // .split('/')[1] extrae la segunda parte después del "/"
    // Ejemplos:
    // - "image/jpeg" -> split('/') -> ["image", "jpeg"] -> [1] -> "jpeg"
    // - "image/png"  -> split('/') -> ["image", "png"]  -> [1] -> "png"
    // - "text/plain" -> split('/') -> ["text", "plain"] -> [1] -> "plain"
    const fileExptension = file.mimetype.split('/')[1];

    // LISTA DE EXTENSIONES VÁLIDAS:
    // Solo permitimos imágenes en estos formatos
    const validExtensions = ['jpg','jpeg','png', 'gif'];

    // VALIDACIÓN 2: Verificar si la extensión está en la lista de válidas
    // .includes() retorna true si el elemento existe en el array
    if (validExtensions.includes(fileExptension)){
       // callback(null, true) -> Le dice a Multer: "Archivo válido, procede a guardarlo"
       // El primer parámetro null indica que no hay error
       // El segundo parámetro true indica que acepta el archivo
       return callback(null, true)
    }

    // Si llegamos aquí, el archivo NO es una imagen válida
    // callback(null, false) -> Le dice a Multer: "Archivo rechazado, no lo guardes"
    // El false hace que Multer no guarde el archivo, pero NO lanza excepción
    // Por eso en el controlador verificamos si file existe
    callback(null, false)

}