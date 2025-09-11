export const pokemonIds: number[] = [1, 2, 3, 4, 5];

// Al añadir "+" se convierte en número
pokemonIds.push(+"1");

// Una interfaz es una forma de definir la estructura de un objeto
interface Pokemon {
  id: number;
  name: string;
  age?: number;
}

export const bulbasaur: Pokemon = {
  id: 1,
  name: "Bulbasaur",
};

// Definimos un array de pokemons 
export const pokemons: Pokemon[] = [];

pokemons.push(bulbasaur);