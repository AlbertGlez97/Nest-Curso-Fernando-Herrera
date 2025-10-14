import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { handleDBExceptions } from 'src/common/helpers/handleDBExceptions.helper';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, LoginUserDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';

// =========================================================================
// SERVICIO DE AUTENTICACIÓN - LÓGICA DE NEGOCIO PARA USUARIOS
// =========================================================================
// Este servicio maneja toda la lógica relacionada con autenticación:
// - Registro de usuarios (create)
// - Login de usuarios (pendiente implementar)
// - Validación de tokens JWT (pendiente implementar)
// - Gestión de sesiones (pendiente implementar)
//
// DEPENDENCIAS EXTERNAS:
// - bcrypt: Para hashear contraseñas de forma segura
// - TypeORM Repository: Para operaciones de base de datos

@Injectable()
export class AuthService {
  // LOGGER para registrar errores y eventos importantes
  // El nombre 'AuthService' aparecerá en los logs para identificar el origen
  private readonly logger = new Logger('AuthService');

  // =======================================================================
  // INYECCIÓN DE DEPENDENCIAS
  // =======================================================================
  constructor(
    // REPOSITORIO DE USUARIOS:
    // TypeORM inyecta automáticamente el repositorio de la entidad User
    // Esto nos permite hacer operaciones CRUD sin escribir SQL
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,
  ) {}

  // =======================================================================
  // CREAR USUARIO - REGISTRO EN EL SISTEMA
  // =======================================================================
  // Este método registra un nuevo usuario en la base de datos
  //
  // FLUJO DE REGISTRO:
  // 1. Recibe datos validados desde CreateUserDto
  // 2. Separa la contraseña del resto de datos
  // 3. Hashea la contraseña usando bcrypt
  // 4. Crea y guarda el usuario en BD
  // 5. Retorna usuario sin la contraseña (seguridad)
  async create(createUserDto: CreateUserDto) {
    try {
      // PASO 1: SEPARAR CONTRASEÑA DE LOS DEMÁS DATOS
      // Desestructuramos el DTO para manejar la contraseña por separado
      // password: La contraseña en texto plano que vamos a hashear
      // userData: El resto de propiedades (email, fullName)
      const { password, ...userData } = createUserDto;

      // PASO 2: CREAR ENTIDAD USER EN MEMORIA
      // .create() NO guarda en BD, solo crea el objeto con los datos
      const user = this.userRepository.create({
        ...userData, // email, fullName

        // HASHEO DE CONTRASEÑA CON BCRYPT:
        // bcrypt.hashSync() convierte la contraseña en texto plano a un hash
        //
        // PARÁMETROS:
        // - password: "MyPassword123" (texto plano)
        // - 10: salt rounds (número de iteraciones del algoritmo)
        //
        // PROCESO:
        // 1. bcrypt genera un "salt" aleatorio (cadena única)
        // 2. Combina el salt con la contraseña
        // 3. Ejecuta el algoritmo de hashing 2^10 = 1024 veces
        // 4. Retorna el hash final: "$2b$10$abcd1234efgh5678..."
        //
        // CARACTERÍSTICAS DEL HASH:
        // - Longitud fija (~60 caracteres)
        // - Incluye el salt (no necesitas guardarlo por separado)
        // - Irreversible (no se puede obtener la contraseña original)
        // - Dos contraseñas iguales generan hashes diferentes (por el salt)
        //
        // EJEMPLO:
        // Entrada:  "MyPassword123"
        // Salida:   "$2b$10$N9qo8uLOickgx2ZMRZoMye.fN/K7g4R.RmKlBjH3hnL3MQFZ7qY/S"
        //
        // ⚠️ IMPORTANTE: Usamos hashSync (síncrono) por simplicidad
        // En producción con alta carga, considera bcrypt.hash() (asíncrono)
        password: bcrypt.hashSync(password, 10),
      });

      // PASO 3: GUARDAR USUARIO EN LA BASE DE DATOS
      // .save() ejecuta el INSERT en PostgreSQL
      // Equivale a:
      // INSERT INTO users (id, email, password, fullName, isActive, roles)
      // VALUES (uuid, 'user@example.com', '$2b$10$...', 'Juan Pérez', true, ['user'])
      await this.userRepository.save(user);

      // PASO 4: RETORNAR USUARIO SIN LA CONTRASEÑA
      return {
        ...user,
        password: undefined,
        token: this.getJwtToken({ id: user.id, email: user.email }),
      };
    } catch (error) {
      handleDBExceptions(error, this.logger);
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    try {
      const user = await this.userRepository.findOne({
        where: { email },
        select: { email: true, password: true, id: true },
      });

      if (!user) {
        throw new Error('Credentials are not valid (email)');
      }

      if (!bcrypt.compareSync(password, user.password)) {
        throw new Error('Credentials are not valid (password)');
      }

      return {
        ...user,
        token: this.getJwtToken({ id: user.id, email: user.email }),
      };
    } catch (error) {
      handleDBExceptions(error, this.logger);
    }
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }
}
