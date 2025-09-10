# Ejecutar en desarrollo

1. Clonar el repositorio
2. Ejecutar

```
yarn install
```

3. Tener Nest CLI instalado

```
npm i -g @nestjs/cli
```

4. Levantar la base de datos

```
docker-compose up -d
```

5. Clonar el archivo __.env.template__ y renombrar la copa a __.env___ 

6. Llenar las variables de entornoe definidad en el ```.env``` 

7. Ejecutar la aplicacion en dev:
´´´
yarn start:dev
´´´

8. Reconstruir la base de datos con la semilla 
´´´
http://localhost:3000/api/v2/seed
´´´


El comando `docker-compose up -d` se utiliza para iniciar los servicios definidos en el archivo `docker-compose.yml` en segundo plano (modo "detached"). Esto permite levantar todos los contenedores necesarios para la aplicación sin bloquear la terminal, facilitando el despliegue y la gestión de entornos de desarrollo o producción.

```yaml
version: '3'

services:
  db:
    image: mongo:5
    restart: always
    ports:
      - '27017:27017'
    environment:
      MONGODB_DATABASE: nest-pokemon
    volumes:
      - ./mongo:/data/db
```

Este archivo `docker-compose.yml` define un servicio llamado `db` que utiliza la imagen oficial de MongoDB versión 5. El servicio se reiniciará automáticamente si falla (`restart: always`), expone el puerto 27017 para conexiones locales, establece la base de datos por defecto como `nest-pokemon` y monta un volumen local para persistencia de datos.

# Librerias utilizadas 

El comando:

```
yarn add @nestjs/mongoose mongoose
```

instala dos dependencias esenciales para trabajar con bases de datos MongoDB en aplicaciones NestJS:

- **`mongoose`**: Es una biblioteca de Node.js que facilita la interacción con bases de datos MongoDB, proporcionando una capa de abstracción para definir esquemas, realizar validaciones y ejecutar consultas de manera sencilla.
- **`@nestjs/mongoose`**: Es el paquete oficial de NestJS que integra Mongoose en el framework, permitiendo aprovechar la inyección de dependencias, decoradores y otras características propias de NestJS para trabajar con modelos y esquemas de MongoDB de forma estructurada y escalable.

Instalar estos paquetes permite que tu aplicación NestJS se conecte a MongoDB, defina modelos de datos y realice operaciones CRUD de manera eficiente y siguiendo las mejores prácticas del framework.


* * joi 

El paquete join de npm es una pequeña utilidad que permite coordinar múltiples operaciones asíncronas en JavaScript, actuando como un contador de callbacks: cada vez que una tarea finaliza se registra su resultado, se pueden recibir notificaciones parciales con notify(), y cuando todas han terminado se ejecuta una función final mediante then(), funcionando de manera similar a lo que hoy se logra con Promise.all o async/await.