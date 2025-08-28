import { name } from "./bases/01-types";
import { charmander } from "./bases/06-decorators";
import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
  <h1>Hola ${name}</h1>
  <h2>${charmander.name}</h2>
  </div>
`;
