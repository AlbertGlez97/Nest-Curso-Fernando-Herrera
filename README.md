# Principios SOLID y Genéricos en TypeScript

## Principios SOLID

### S - Single Responsibility Principle (SRP)
- Cada clase debe tener una única responsabilidad, es decir, una sola razón para cambiar.
- Facilita el mantenimiento y la comprensión del código.

### O - Open/Closed Principle (OCP)
- El código debe estar abierto para extensión, pero cerrado para modificación.
- Puedes agregar nuevas funcionalidades sin modificar el código existente.

### L - Liskov Substitution Principle (LSP)
- Las clases derivadas deben poder sustituir a sus clases base sin alterar el comportamiento del programa.
- Garantiza la correcta herencia y polimorfismo.

#### Ejemplo del Principio de Sustitución de Liskov:
```typescript
// Clase base
class Ave {
    volar(): void {
        console.log('Volando...');
    }
}

// Clase derivada que cumple LSP
class Gorrión extends Ave {
    volar(): void {
        console.log('Volando como gorrión');
    }
}

// Clase que podría violar LSP
class Pingüino extends Ave {
    volar(): void {
        throw new Error('No puedo volar'); // Viola LSP
    }
}
```

### I - Interface Segregation Principle (ISP)
- Los clientes no deben verse obligados a depender de interfaces que no utilizan.
- Es mejor tener varias interfaces específicas que una general.

### D - Dependency Inversion Principle (DIP)
- Los módulos de alto nivel no deben depender de módulos de bajo nivel, ambos deben depender de abstracciones.
- Facilita la inyección de dependencias y el desacoplamiento.

## Genéricos en TypeScript

Los genéricos son una característica que permite crear componentes que pueden trabajar con múltiples tipos de datos mientras mantienen la seguridad de tipos.

### Beneficios de los Genéricos:
- Reutilización de código
- Seguridad de tipos en tiempo de compilación
- Flexibilidad en el manejo de datos

### Ejemplo de Genéricos:
```typescript
// Función genérica
function identity<T>(arg: T): T {
    return arg;
}

// Clase genérica
class Container<T> {
    private value: T;

    constructor(value: T) {
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }
}
```

## ¿Para qué sirven los principios SOLID?
- Crear software más mantenible, escalable y flexible
- Facilitar la reutilización de código
- Reducir la complejidad
- Mejorar la calidad del desarrollo
- Facilitar el testing y la depuración

## Interfaces y Patrón Adapter en TypeScript

### Interfaces
Las interfaces en TypeScript son contratos que definen la estructura que debe tener una clase. Principales características:
- Definen un conjunto de métodos y propiedades que una clase debe implementar
- Permiten crear código más modular y mantenible
- Facilitan el cumplimiento del principio de sustitución de Liskov

### Palabra clave `implements`
- Se utiliza para declarar que una clase debe cumplir con el contrato definido por una interfaz
- Obliga a la clase a implementar todos los métodos y propiedades definidos en la interfaz
- Ayuda a detectar errores en tiempo de compilación

### Ejemplo Práctico con HttpAdapter:
```typescript
// Definición de la interfaz
interface HttpAdapter {
  get<T>(url: string): Promise<T>;
}

// Implementación con Fetch
class PokeApiFetchAdapter implements HttpAdapter {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(url);
    return await response.json();
  }
}

// Implementación con Axios
class PokeApiAdapter implements HttpAdapter {
  private readonly axios = axios;
  
  async get<T>(url: string): Promise<T> {
    const { data } = await this.axios.get<T>(url);
    return data;
  }
}
```

### Beneficios de este Enfoque:
1. **Desacoplamiento**: Las clases que usan HttpAdapter no necesitan conocer la implementación específica
2. **Intercambiabilidad**: Podemos cambiar entre implementaciones (Fetch/Axios) sin modificar el código cliente
3. **Testabilidad**: Facilita la creación de mocks para pruebas
4. **Mantenibilidad**: Cada adaptador puede evolucionar independientemente
5. **Extensibilidad**: Podemos agregar nuevos adaptadores sin modificar el código existente

### Relación con Principios SOLID:
- **Single Responsibility**: Cada adaptador tiene una única responsabilidad
- **Open/Closed**: Podemos agregar nuevos adaptadores sin modificar el código existente
- **Liskov Substitution**: Cualquier implementación de HttpAdapter puede ser usada de manera intercambiable
- **Interface Segregation**: La interfaz HttpAdapter define solo los métodos necesarios
- **Dependency Inversion**: Las clases dependen de abstracciones (HttpAdapter) no de implementaciones concretas

// ...existing code...

## Decoradores en TypeScript

Los decoradores son un patrón de diseño que permite añadir funcionalidad adicional a clases, métodos, propiedades o parámetros de manera declarativa.

### Características principales
- Son funciones especiales precedidas por el símbolo `@`
- Se ejecutan en tiempo de definición (no en tiempo de ejecución)
- Pueden modificar la estructura y comportamiento de las declaraciones
- Son una característica experimental en TypeScript

### Tipos de Decoradores

1. **Decoradores de Clase**
```typescript
function ClassDecorator() {
    return function (target: Function) {
        // Modifica o extiende la clase
    };
}

@ClassDecorator()
class Example {}
```

2. **Decoradores de Método**
```typescript
function MethodDecorator() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        // Modifica el comportamiento del método
    };
}

class Example {
    @MethodDecorator()
    method() {}
}
```

3. **Decoradores de Propiedad**
```typescript
function PropertyDecorator() {
    return function (target: any, propertyKey: string) {
        // Modifica la propiedad
    };
}

class Example {
    @PropertyDecorator()
    property: string;
}
```

4. **Decoradores de Parámetro**
```typescript
function ParameterDecorator() {
    return function (target: any, propertyKey: string, parameterIndex: number) {
        // Modifica el parámetro
    };
}

class Example {
    method(@ParameterDecorator() param: string) {}
}
```

### Decoradores de Fábrica (Factory Decorators)

Son funciones que retornan un decorador. Permiten personalizar cómo se aplica el decorador:

```typescript
function DecoratorFactory(config: any) {
    return function (target: any) {
        // Implementación del decorador usando config
    }
}

@DecoratorFactory({
    option1: 'value1',
    option2: 'value2'
})
class Example {}
```

### Casos de Uso Comunes

1. **Registro de Metadatos**
   - Añadir información adicional a elementos del código
   - Útil para frameworks como NestJS

2. **Validación**
   - Verificar propiedades o parámetros
   - Implementar reglas de negocio

3. **Inyección de Dependencias**
   - Gestionar la creación y distribución de instancias
   - Fundamental en frameworks modernos

4. **Logging y Monitoreo**
   - Registrar información de ejecución
   - Medir rendimiento

### Ejemplo Práctico

```typescript
function LogClass() {
    return function (target: Function) {
        // Guarda el constructor original
        const original = target;

        // Nueva función constructora
        const construct = function (...args: any[]) {
            console.log(`Creando nueva instancia de ${original.name}`);
            return new original(...args);
        }

        // Copia el prototipo
        construct.prototype = original.prototype;

        return construct as typeof target;
    };
}

@LogClass()
class Pokemon {
    constructor(public name: string) {}
}

const pikachu = new Pokemon("Pikachu");
// Output: "Creando nueva instancia de Pokemon"
```

### Beneficios

1. **Código más Limpio**
   - Separa las preocupaciones transversales
   - Reduce la duplicación de código

2. **Reutilización**
   - Los decoradores pueden aplicarse a múltiples elementos
   - Facilita la mantención del código

3. **Declarativo**
   - Expresa la intención claramente
   - Mejora la legibilidad del código

4. **Extensibilidad**
   - Permite modificar el comportamiento sin cambiar el código original
   - Facilita la adaptación a nuevos requisitos
