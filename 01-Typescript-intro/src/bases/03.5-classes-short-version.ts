import axios from "axios";
import type { Move, PokeapiResponse } from "../interfaces/pokeapi-response.interface";

export class PokemonShort {
  // Un get es un método que se utiliza para acceder a una propiedad de la clase
  // se visualiza como una propiedad
  get imageUrl(): string {
    // El this apunta a la instancia de la clase
    return `https://pokeapi.co/api/v2/pokemon/${this.id}/`;
  }

  constructor(
    // readonly es un modificador de acceso que indica que la propiedad no se puede modificar una vez que se ha establecido
    public readonly id: number,
    public name: string,
    public age?: number
  ) {}

  // Un metodo es una función que se define dentro de una clase
  // Se ejecuta cuando se llama al método
  scream() {
    console.log(`${this.name.toUpperCase()}!!!`);
    // Se llama al método privado
    this.speak();
  }

  // Private es un modificador de acceso que indica que la propiedad o método no se puede acceder desde fuera de la clase
  private speak() {
    console.log(`${this.name}, ${this.name}`);
  }

  // Un metodo asíncrono es una función que se define dentro de una clase y
  // que puede realizar operaciones asíncronas, esto lo convierte en una promesa.
  // Una promesa es un objeto que representa la finalización o el fracaso de una operación asíncrona.
  // Una operacion asincrona es una tarea que se ejecuta en segundo plano y no bloquea el hilo principal.
  async getMoves() : Promise<Move[]> {
    // await es una expresión que se utiliza para esperar la resolución de una promesa.
    const { data } = await axios.get<PokeapiResponse>(
      `https://pokeapi.co/api/v2/pokemon/4`
    );
    return data.moves;
  }
}

export const pikachu = new PokemonShort(25, "Pikachu", 3);

//pikachu.id = 10; // Error: Cannot assign to 'id' because it is a read-only property.

// Se llama a los métodos
pikachu.scream();
//pikachu.speak();
// Llamamos el metodo asincrono , que nos devuelve una promesa.
pikachu.getMoves().then((moves) => console.log(moves));
