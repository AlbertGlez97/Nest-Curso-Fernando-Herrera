import axios from "axios";

/**
 * HttpAdapter es una interfaz que define un contrato para adaptadores HTTP.
 * Las interfaces en TypeScript son una forma de definir la estructura que deben seguir las clases,
 * actuando como un contrato que garantiza que las clases que la implementen tengan ciertos métodos y propiedades.
 */
export interface HttpAdapter {
  get<T>(url: string): Promise<T>;
}

/**
 * Implementa la interfaz HttpAdapter usando la API fetch nativa.
 * La palabra clave 'implements' asegura que esta clase cumpla con el contrato definido en HttpAdapter,
 * lo que significa que debe implementar todos los métodos definidos en la interfaz.
 */
export class PokeApiFetchAdapter implements HttpAdapter {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(url);
    const data: T = await response.json();
    return data;
  }
}

/**
 * Implementa la interfaz HttpAdapter usando la librería Axios.
 * Al implementar la misma interfaz que PokeApiFetchAdapter, esta clase
 * puede ser usada de manera intercambiable, siguiendo el principio de
 * sustitución de Liskov (LSP) de SOLID.
 */
export class PokeApiAdapter implements HttpAdapter {
  private readonly axios = axios;

  async get<T>(url: string): Promise<T> {
    const { data } = await this.axios.get<T>(url);
    return data;
  }
}
