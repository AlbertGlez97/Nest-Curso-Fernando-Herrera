/**
 * Clase que representa un nuevo comportamiento para Pokémon
 * Esta clase será utilizada como reemplazo mediante el decorador
 */
class newPokemon {
    constructor(public readonly id: number, public name: string) {}

    scream() {
        console.log(`No quiero!!!`);
    }

    speak() {
        console.log(`No quiero hablar!!!`);
    }
}

/**
 * Decorador de clase que modifica el comportamiento de Pokemon
 * Los decoradores son funciones que pueden modificar clases, métodos, propiedades o parámetros
 * En este caso, es un decorador de fábrica (factory decorator) que retorna otra función
 * 
 * @returns Una función que recibe como parámetro el constructor de la clase decorada
 *          y retorna una nueva clase (newPokemon) para reemplazar la original
 */
const MyDecorator = () => {
    // target: Function - Es el constructor de la clase que está siendo decorada
    return (target: Function) => {
        // Retorna la clase newPokemon que reemplazará a la clase original
        return newPokemon;
    };
};

/**
 * @MyDecorator() - Aplicación del decorador a la clase Pokemon
 * El decorador se ejecuta en tiempo de definición de la clase, no en tiempo de ejecución
 * En este caso, reemplaza completamente la clase Pokemon por newPokemon
 */
@MyDecorator()
export class Pokemon {
    constructor(public readonly id: number, public name: string) {}

    scream() {
        console.log(`${this.name.toUpperCase()}!!!`);
    }

    speak() {
        console.log(`${this.name}, ${this.name}`);
    }
}

// Instancia de Pokemon que en realidad será una instancia de newPokemon
// debido al decorador
export const charmander = new Pokemon(4, "Charmander");

// Estas llamadas ejecutarán los métodos de newPokemon, no de Pokemon
charmander.scream(); // Output: "No quiero!!!"
charmander.speak();  // Output: "No quiero hablar!!!"
