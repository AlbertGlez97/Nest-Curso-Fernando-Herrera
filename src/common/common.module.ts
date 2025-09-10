import { Module } from '@nestjs/common';
import { AxiosAdapter } from './adapters/axios.adapter';

/**
 * Módulo común que proporciona funcionalidades compartidas
 * para toda la aplicación.
 * 
 * @providers - Incluye el AxiosAdapter para realizar peticiones HTTP
 * @exports - Expone el AxiosAdapter para que otros módulos puedan utilizarlo
 */
@Module({
    providers: [AxiosAdapter],  // Registra el AxiosAdapter como proveedor
    exports: [AxiosAdapter],    // Permite que otros módulos usen el AxiosAdapter
})
export class CommonModule {}
