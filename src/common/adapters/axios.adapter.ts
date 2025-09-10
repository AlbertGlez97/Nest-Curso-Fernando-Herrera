import axios, { AxiosInstance } from 'axios';
import { HttpAdapter } from '../interfaces/http-adapter.interface';
import { Injectable } from '@nestjs/common';

/**
 * Adaptador que implementa la interfaz HttpAdapter utilizando Axios como cliente HTTP.
 * Esta clase sirve como una capa de abstracción para realizar peticiones HTTP.
 * 
 * @implements {HttpAdapter}
 * @export
 * @class AxiosAdapter
 * 
 * @property {AxiosInstance} axios - Instancia de Axios para realizar peticiones HTTP.
 */
@Injectable()
export class AxiosAdapter implements HttpAdapter {
  private axios: AxiosInstance = axios;

  async get<T>(url: string): Promise<T> {
    try {
      const { data } = await this.axios.get<T>(url);
      return data;
    } catch (error) {
      throw new Error('Error in GET request');
    }
  }

}
