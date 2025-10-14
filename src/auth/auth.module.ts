import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';

// =========================================================================
// MÓDULO DE AUTENTICACIÓN - CONFIGURACIÓN DE AUTH
// =========================================================================
// Este módulo encapsula toda la funcionalidad relacionada con
// autenticación y gestión de usuarios
//
// RESPONSABILIDADES:
// - Registro de usuarios
// - Autenticación con contraseñas (bcrypt)
// - Generación y validación de tokens JWT (pendiente)
// - Gestión de roles y permisos (pendiente)
//
// ARQUITECTURA MODULAR:
// Este módulo sigue el patrón de NestJS donde cada feature
// tiene su propio módulo autocontenido con:
// - Controllers: Manejo de rutas HTTP
// - Services: Lógica de negocio
// - Entities: Modelos de base de datos
// - DTOs: Validación de datos de entrada

@Module({
  // =======================================================================
  // CONTROLLERS - MANEJO DE RUTAS HTTP
  // =======================================================================
  // Controladores que manejan las peticiones HTTP del módulo
  //
  // AuthController: Expone endpoints en /api/auth
  // - POST /api/auth/register: Registrar usuario
  // - POST /api/auth/login: Iniciar sesión (pendiente)
  // - GET /api/auth/profile: Obtener perfil (pendiente)
  controllers: [AuthController],

  // =======================================================================
  // PROVIDERS - SERVICIOS Y LÓGICA DE NEGOCIO
  // =======================================================================
  // Servicios que pueden ser inyectados en otros componentes del módulo
  //
  // AuthService: Contiene la lógica de negocio para:
  // - Crear usuarios y hashear contraseñas
  // - Validar credenciales (pendiente)
  // - Generar tokens JWT (pendiente)
  providers: [AuthService, JwtStrategy],

  // =======================================================================
  // IMPORTS - MÓDULOS EXTERNOS NECESARIOS
  // =======================================================================
  // Módulos que este módulo necesita para funcionar
  //
  // TypeOrmModule.forFeature([User]):
  // Registra la entidad User en TypeORM para este módulo
  // Esto permite:
  // - Inyectar Repository<User> en AuthService
  // - Hacer operaciones CRUD sobre la tabla 'users'
  // - TypeORM se encarga de crear/actualizar la tabla automáticamente
  //   (gracias a synchronize: true en app.module.ts)
  //
  // PATRÓN forFeature vs forRoot:
  // - forRoot: Configuración global (en AppModule)
  //   - Conexión a la base de datos
  //   - Configuración de TypeORM
  // - forFeature: Configuración por módulo
  //   - Registra entidades específicas del módulo
  //   - Permite inyectar repositorios en servicios
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        let JWT_SECRET = configService.get<string>('JWT_SECRET');
        if (!JWT_SECRET || JWT_SECRET.length === 0) {
          throw new Error(
            'JWT_SECRET needs to be defined in the environment variables.',
          );
        }

        return {
          secret: JWT_SECRET,
          signOptions: { expiresIn: '2h' },
        };
      },
    }),
  ],

  // =======================================================================
  // EXPORTS - QUÉ EXPONE ESTE MÓDULO A OTROS
  // =======================================================================
  // Servicios o módulos que este módulo hace disponibles para
  // otros módulos que lo importen
  //
  // TypeOrmModule:
  // Exportamos el TypeOrmModule con la entidad User registrada
  //
  // ¿POR QUÉ EXPORTAR?
  // Si otros módulos necesitan acceso al repositorio de User,
  // pueden importar AuthModule en lugar de volver a registrar
  // la entidad User con TypeOrmModule.forFeature([User])
  //
  // CASO DE USO:
  // Si ProductsModule necesita relacionar productos con usuarios:
  //
  // @Module({
  //   imports: [AuthModule], // Importa AuthModule
  //   // ... resto de configuración
  // })
  // export class ProductsModule {}
  //
  // Ahora ProductsService puede inyectar:
  // @InjectRepository(User)
  // private readonly userRepository: Repository<User>
  //
  // SIN necesidad de volver a registrar User en ProductsModule
  //
  // ALTERNATIVA:
  // Si prefieres no exportar TypeOrmModule, puedes exportar AuthService:
  // exports: [AuthService]
  // Y otros módulos usarían AuthService.findUserById() en lugar de
  // acceder directamente al repositorio (más encapsulación)
  exports: [TypeOrmModule, JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {}
