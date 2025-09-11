import type { Move, PokeapiResponse } from "../interfaces/pokeapi-response.interface";
import type { HttpAdapter } from '../api/pokeApi.adapter';
import { PokeApiAdapter, PokeApiFetchAdapter } from '../api/pokeApi.adapter';

/**
 * Clase que representa un Pokémon
 * Implementa el patrón de inyección de dependencias para la comunicación HTTP
 */
export class Pokemon {

    /**
     * Getter que retorna la URL de la imagen del Pokémon
     * basada en su ID
     */
    get imageUrl(): string {
        return `https://pokemon.com/${this.id}.jpg`;
    }

    /**
     * Constructor de la clase Pokemon
     * @param id - Identificador único del Pokémon
     * @param name - Nombre del Pokémon
     * @param http - Adaptador HTTP inyectado para realizar peticiones
     */
    constructor(
        public readonly id: number,
        public name: string,
        private readonly http: HttpAdapter
    ) { }

    /**
     * Método que simula el grito del Pokémon
     * Imprime el nombre en mayúsculas
     */
    scream() {
        console.log(`${this.name.toUpperCase()}!!!`);
    }

    /**
     * Método que simula el habla del Pokémon
     * Imprime el nombre dos veces
     */
    speak() {
        console.log(`${this.name}, ${this.name}`);
    }

    /**
     * Método asíncrono que obtiene los movimientos del Pokémon
     * utilizando el adaptador HTTP inyectado
     * @returns Promise con el array de movimientos del Pokémon
     */
    async getMoves(): Promise<Move[]> {
        const data = await this.http.get<PokeapiResponse>(`https://pokeapi.co/api/v2/pokemon/${this.id}`);
        console.log(data.moves);

        return data.moves;
    }
}

// Creamos instancias de los adaptadores HTTP disponibles
const pokeApi = new PokeApiAdapter(); // Usa Axios
const pokeApiFetch = new PokeApiFetchAdapter(); // Usa Fetch API

// Creamos una instancia de Pokemon usando el adaptador con Fetch
export const charmander = new Pokemon(4, 'Charmander', pokeApiFetch);

// Llamamos al método para obtener los movimientos
charmander.getMoves();