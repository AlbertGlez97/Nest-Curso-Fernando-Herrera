import { name } from "./bases/01-types";
import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
  <h1>Hola ${name}</h1>
  </div>
`;
