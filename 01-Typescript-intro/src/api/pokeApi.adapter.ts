import axios from "axios";

// Un adapter que utiliza la función fetch para hacer peticiones HTTP
export class PokeApiFetchAdapter {
    /**
     * Método genérico para realizar peticiones GET usando fetch.
     * 
     * Un método genérico es aquel que puede trabajar con diferentes tipos de datos.
     * Un "genérico" en TypeScript se define usando <T>, donde T es un parámetro de tipo
     * que se determina cuando se llama al método.
     * 
     * @param url - URL a la que se realiza la petición GET
     * @returns Una promesa que resuelve con el tipo de dato especificado (T)
     */
    async get<T>(url: string): Promise<T> {
        const response = await fetch(url);
        const data: T = await response.json();
        return data;
    }
}

// Un adapter que utiliza Axios para hacer peticiones HTTP
export class PokeApiAdapter {
    // Instancia de Axios para realizar peticiones
    private readonly axios = axios;

    /**
     * Método genérico para realizar peticiones GET usando Axios.
     * 
     * Al igual que el anterior, este método es genérico y puede retornar cualquier tipo de dato.
     * El tipo de dato se especifica al llamar al método.
     * 
     * @param url - URL a la que se realiza la petición GET
     * @returns Una promesa que resuelve con el tipo de dato especificado (T)
     */
    async get<T>(url: string): Promise<T> {
        const { data } = await this.axios.get<T>(url);
        return data;
    }
}
