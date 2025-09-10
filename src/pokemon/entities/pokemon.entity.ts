import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Representa la entidad Pokemon en la base de datos MongoDB.
 * Extiende de Document para heredar las funcionalidades de Mongoose.
 * 
 * @class Pokemon
 * @extends {Document}
 * 
 * @decorator @Schema()
 * Indica que esta clase es un esquema de Mongoose para MongoDB
 */

/**
 * @property {string} name
 * Nombre del Pokemon
 * @decorator @Prop({ unique: true, index: true })
 * - unique: Asegura que el nombre sea único en la colección
 * - index: Crea un índice para optimizar las búsquedas por este campo
 */

/**
 * @property {number} no
 * Número identificador del Pokemon
 * @decorator @Prop({ unique: true, index: true })
 * - unique: Asegura que el número sea único en la colección
 * - index: Crea un índice para optimizar las búsquedas por este campo
 * 
 * Nota: El id no se declara explícitamente ya que MongoDB lo genera automáticamente
 */
@Schema()
export class Pokemon extends Document {
  //id: string; // Mongo me lo da
  @Prop({ unique: true, index: true })
  name: string;
  @Prop({ unique: true, index: true })
  no: number;
}

export const PokemonSchema = SchemaFactory.createForClass(Pokemon);
