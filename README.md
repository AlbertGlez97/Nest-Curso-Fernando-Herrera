## Generadores de NestJS (CLI)

NestJS tiene un comando CLI (`nest generate ...`) que sirve para crear diferentes piezas de tu aplicación.  
Cada una cumple un rol distinto, y aquí te lo explico de forma sencilla:

| Comando       | Alias  | Explicación didáctica                                                                 |
|---------------|--------|----------------------------------------------------------------------------------------|
| `application` | `application` | Crea una nueva aplicación completa. **Es como arrancar una nueva casa desde los cimientos.** |
| `class`       | `cl`   | Genera una clase vacía. **Piensa en ella como un bloque de construcción reutilizable.** |
| `configuration` | `config` | Crea un archivo de configuración. **Es como el manual de instrucciones de tu app.** |
| `controller`  | `co`   | Crea un **controller**, que recibe las peticiones HTTP y responde. **Es como el recepcionista que atiende a los visitantes.** |
| `decorator`   | `d`    | Crea un **decorador**. **Son etiquetas especiales que añaden superpoderes a clases o métodos.** |
| `filter`      | `f`    | Genera un **filter**, que maneja errores. **Es como el seguro de protección: si algo falla, él lo atrapa.** |
| `gateway`     | `ga`   | Crea un **gateway**, usado para tiempo real (ej. WebSockets). **Es como un walkie-talkie para comunicación en vivo.** |
| `guard`       | `gu`   | Crea un **guard**, que protege rutas. **Es como el guardia de seguridad: decide quién pasa y quién no.** |
| `interceptor` | `itc`  | Crea un **interceptor**. **Es como un filtro de Instagram: transforma la petición o la respuesta antes de mostrarse.** |
| `interface`   | `itf`  | Genera una **interfaz** de TypeScript. **Es como un contrato que dice qué datos debe tener algo.** |
| `library`     | `lib`  | Crea una librería dentro de un monorepo. **Piensa en ella como un paquete de Lego que puedes usar en varias construcciones.** |
| `middleware`  | `mi`   | Genera un **middleware**, que se ejecuta antes de llegar al controller. **Es como el filtro de seguridad del aeropuerto que revisa todo antes de entrar.** |
| `module`      | `mo`   | Crea un **módulo**, que organiza controllers, servicios y demás. **Es como una carpeta que agrupa todo lo relacionado a un tema.** |
| `pipe`        | `pi`   | Genera un **pipe**, que transforma o valida datos de entrada. **Es como una tubería que limpia el agua antes de llegar al grifo.** |
| `provider`    | `pr`   | Crea un **provider**, normalmente usado para lógica de negocio. **Es como el técnico que resuelve cosas tras bambalinas.** |
| `resolver`    | `r`    | Crea un **resolver** para GraphQL. **Es como el mesero que lleva exactamente lo que pediste del menú (consultas/mutaciones).** |
| `resource`    | `res`  | Crea un CRUD completo. **Es como recibir un combo ya armado: controller + service + pruebas listas.** |
| `service`     | `s`    | Genera un **service**, donde vive la lógica de negocio. **Es como el chef que prepara la comida en la cocina.** |
| `sub-app`     | `app`  | Crea una sub-aplicación dentro de un monorepo. **Es como tener varios departamentos en la misma empresa.** |


## Flujo de comunicación en NestJS

En una aplicación típica de NestJS, la información viaja de esta forma:

**Cliente → Controller → Service → Base de datos**

- **Cliente**: Puede ser un navegador, una app móvil o cualquier otro sistema que hace una petición (ej. pedir datos o enviar información).  
- **Controller**: Es quien recibe la petición del cliente. Aquí se definen las rutas (endpoints).  
- **Service**: Contiene la lógica de negocio. El controller le pide ayuda al service para procesar lo solicitado.  
- **Base de datos**: Donde se guardan o consultan los datos. El service se comunica con ella y devuelve la respuesta al controller.  
- Finalmente, **el controller envía la respuesta al cliente**.

➡️ En pocas palabras:  
El cliente pide → el controller escucha → el service trabaja → la base de datos responde → y todo regresa al cliente.

## ¿Qué es un DTO?

Un **DTO** (Data Transfer Object) es un patrón de diseño utilizado para transferir datos entre diferentes capas de una aplicación, especialmente entre el backend y el frontend, o entre servicios. Los DTOs son objetos simples que solo contienen atributos y, opcionalmente, métodos para acceder a esos datos (getters y setters), pero no incluyen lógica de negocio.

### ¿Por qué usar DTOs?

- **Separación de Concerns:** Permiten separar la lógica de negocio de la estructura de los datos que se transfieren.
- **Seguridad:** Evitan exponer entidades completas del modelo de datos, mostrando solo la información necesaria.
- **Eficiencia:** Reducen la cantidad de datos transferidos, optimizando el rendimiento de la aplicación.
- **Facilidad de mantenimiento:** Facilitan la evolución de la API sin afectar directamente el modelo de datos interno.

### Ejemplo de uso de un DTO

Supongamos que tienes una entidad `Usuario` en tu base de datos con muchos atributos, pero solo quieres enviar el nombre y el correo electrónico al frontend.

**Entidad Usuario (User Entity):**
```typescript
export class Usuario {
    id: number;
    nombre: string;
    correo: string;
    contraseña: string;
    fechaRegistro: Date;
    // ...otros atributos
}
```

**DTO para enviar al frontend:**
```typescript
export class UsuarioDto {
    nombre: string;
    correo: string;
}
```

**Uso en el Service:**
```typescript
import { UsuarioDto } from './usuario.dto';
import { Usuario } from './usuario.entity';

function toUsuarioDto(usuario: Usuario): UsuarioDto {
    return {
        nombre: usuario.nombre,
        correo: usuario.correo,
    };
}
```

De esta forma, solo envías al frontend los datos necesarios, manteniendo segura la información sensible y facilitando el mantenimiento de tu API.

## ¿Para qué se utilizan `class-validator` y `class-transformer` en NestJS?

En NestJS, estas dos librerías se usan principalmente para validar y transformar los datos que llegan a tus endpoints, especialmente cuando trabajas con DTOs.

- **`class-validator`**: Permite agregar reglas de validación a las propiedades de tus clases (por ejemplo, asegurarse de que un campo sea un email válido, que no esté vacío, etc.).
- **`class-transformer`**: Convierte objetos planos (como los que llegan en una petición HTTP) en instancias de clases TypeScript, y también permite transformar o excluir propiedades.

### Instalación con Yarn

```bash
yarn add class-validator class-transformer
```

### Ejemplo de uso

Supón que tienes un DTO para crear usuarios:

```typescript
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
    @IsNotEmpty()
    nombre: string;

    @IsEmail()
    correo: string;
}
```

En tu controller, puedes usar el pipe `ValidationPipe` para que NestJS valide automáticamente los datos recibidos:

```typescript
@Post()
create(@Body() createUserDto: CreateUserDto) {
    // Si los datos no cumplen las reglas, NestJS responde con un error 400
    return this.userService.create(createUserDto);
}
```

Así, te aseguras de que los datos sean correctos antes de procesarlos en tu aplicación.

## ¿Qué es una Entity en NestJS?

Una **entity** (entidad) en NestJS representa una estructura de datos que normalmente corresponde a una tabla en la base de datos. Las entities se definen como clases TypeScript y se utilizan principalmente con librerías de ORM como TypeORM o Sequelize.

Las entities permiten mapear los datos almacenados en la base de datos a objetos en tu aplicación, facilitando la manipulación y consulta de información.

### Ejemplo de una Entity

Supongamos que tienes una tabla `usuarios` en tu base de datos. La entity correspondiente podría verse así:

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Usuario {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @Column()
    correo: string;

    @Column()
    fechaRegistro: Date;
}
```

### ¿Para qué se usan las entities?

- **Persistencia de datos:** Permiten guardar, actualizar, eliminar y consultar registros en la base de datos de forma sencilla.
- **Integración con ORM:** Facilitan el uso de herramientas como TypeORM, que automatizan operaciones sobre la base de datos.
- **Definición clara del modelo:** Ayudan a mantener una estructura clara y tipada de los datos que maneja tu aplicación.

En resumen, una entity es el reflejo de una tabla en tu base de datos y es fundamental para trabajar con datos de manera organizada y segura en NestJS.