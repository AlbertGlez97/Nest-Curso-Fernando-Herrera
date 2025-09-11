/**
 * Decorador de método que marca funciones como deprecadas
 * @param deprecationReason - Mensaje que explica por qué el método está deprecado
 * 
 * Este es un decorador de fábrica que retorna el decorador real
 * Se usa para personalizar el comportamiento del decorador con parámetros
 */
const Deprecated = (deprecationReason: string) => {
    /**
     * Decorador real que se aplica al método
     * @param target - La clase que contiene el método (el prototipo)
     * @param memberName - Nombre del método decorado
     * @param propertyDescriptor - Descriptor de la propiedad que contiene la configuración del método
     */
    return (target: any, memberName: string, propertyDescriptor: PropertyDescriptor) => {
      // Retorna un nuevo descriptor de propiedad
      return {
        // Getter para el método decorado, significa que se puede acceder como una propiedad
        get() {
          /**
           * Función wrapper que envuelve al método original
           * Agrega la funcionalidad de advertencia antes de ejecutar el método
           */
          const wrapperFn = (...args: any[]) => {
            // Muestra el mensaje de advertencia
            console.warn(`Method ${ memberName } is deprecated with reason: ${ deprecationReason }`);
            
            // Ejecuta el método original manteniendo el contexto 'this' y pasando los argumentos
            propertyDescriptor.value.apply(this, args); 
          }
          return wrapperFn;
        }
      }
    }   
}

/**
 * Clase Pokemon que implementa el método deprecado
 */
export class Pokemon {
    constructor(
        public readonly id: number, 
        public name: string
    ) {}

    scream() {
        console.log(`${this.name.toUpperCase()}!!!`);
    }

    /**
     * Método marcado como deprecado usando el decorador
     * El decorador mostrará una advertencia cuando este método sea llamado
     */
    @Deprecated('Most use speak2 method instead')
    speak() {
        console.log(`${this.name}, ${this.name}`);
    }

    /**
     * Nuevo método que reemplaza a speak()
     */
    speak2() {
        console.log(`${this.name}, ${this.name}, ${this.name}`);
    }
}

// Ejemplo de uso
export const charmander = new Pokemon(4, "Charmander");

// Esta llamada mostrará la advertencia de deprecación
charmander.speak();