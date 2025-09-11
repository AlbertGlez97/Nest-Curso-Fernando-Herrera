// Una clase es una plantilla para crear objetos
// Una instancia es un objeto creado a partir de una clase
/**
 * Crea una nueva instancia de la clase `Pokemon`.
 *
 * El constructor inicializa las propiedades `id`, `name` y opcionalmente `age` del Pokémon.
 *
 * @param id - Identificador único del Pokémon.
 * @param name - Nombre del Pokémon.
 * @param age - Edad opcional del Pokémon.
 *
 * Dentro del constructor, la palabra clave `this` hace referencia a la instancia actual de la clase,
 * permitiendo asignar los valores recibidos como argumentos a las propiedades correspondientes del objeto.
 */
export class Pokemon {
  // Propiedades de la clase
  public id: number;
  public name: string;
  public age?: number;

  // El constructor sirve para crear una instancia de la clase, es lo que se ejecuta
  // Al crear una nueva instancia de la clase, se deben pasar los valores para las propiedades
  constructor(id: number, name: string, age?: number) {
    this.id = id;
    this.name = name;
    this.age = age;
  }
}

// Creamos una nueva instancia de la clase `Pokemon`
export const charmander = new Pokemon(4, "Charmander", 5);