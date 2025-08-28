import type { Move, PokeapiResponse } from "../interfaces/pokeapi-response.interface";
import { PokeApiAdapter, PokeApiFetchAdapter } from '../api/pokeApi.adapter';

/**
 * Principios SOLID:
 * 
 * S - Single Responsibility Principle (SRP): 
 * Cada clase debe tener una única responsabilidad, es decir, una sola razón para cambiar.
 * Esto facilita el mantenimiento y la comprensión del código.
 * 
 * O - Open/Closed Principle (OCP): 
 * El código debe estar abierto para extensión, pero cerrado para modificación.
 * Puedes agregar nuevas funcionalidades sin modificar el código existente.
 * 
 * L - Liskov Substitution Principle (LSP): 
 * Las clases derivadas deben poder sustituir a sus clases base sin alterar el comportamiento del programa.
 * Garantiza la correcta herencia y polimorfismo.
 * 
 * I - Interface Segregation Principle (ISP): 
 * Los clientes no deben verse obligados a depender de interfaces que no utilizan.
 * Es mejor tener varias interfaces específicas que una general.
 * 
 * D - Dependency Inversion Principle (DIP): 
 * Los módulos de alto nivel no deben depender de módulos de bajo nivel, ambos deben depender de abstracciones.
 * Facilita la inyección de dependencias y el desacoplamiento.
 * 
 * ¿Para qué sirven?
 * Los principios SOLID ayudan a crear software más mantenible, escalable y flexible.
 * Facilitan la reutilización de código, reducen la complejidad y mejoran la calidad del desarrollo.
 */

export class Pokemon {

    get imageUrl(): string {
        return `https://pokemon.com/${ this.id }.jpg`;
    }
  
    constructor(
        public readonly id: number, 
        public name: string,
        // Todo: inyectar dependencias
        private readonly http: PokeApiAdapter
    ) {}

    scream() {
        console.log(`${ this.name.toUpperCase() }!!!`);
    }

    speak() {
        console.log(`${ this.name }, ${ this.name }`);
    }

    async getMoves(): Promise<Move[]> {
        const data = await this.http.get<PokeapiResponse>(`https://pokeapi.co/api/v2/pokemon/${ this.id }`);
        console.log( data.moves );
        
        return data.moves;
    }

}

// pokeApi es una instancia de PokeApiAdapter
const pokeApi = new PokeApiAdapter();
const pokeApiFetch = new PokeApiFetchAdapter();

export const charmander = new Pokemon( 4, 'Charmander', pokeApi );

charmander.getMoves();