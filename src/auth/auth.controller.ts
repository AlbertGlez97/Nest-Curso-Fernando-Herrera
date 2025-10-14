import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Headers,
  SetMetadata,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from './entities/user.entity';
import { GetUser, RawHeaders, RoleProtected } from './decorators';
import type { IncomingHttpHeaders } from 'http';
import { UserRoleGuard } from './guards';
import { ValidRoles } from './interfaces';
import { Auth } from './decorators/auth.decorator';

// =========================================================================
// CONTROLADOR DE AUTENTICACIÓN - ENDPOINTS RELACIONADOS CON USUARIOS
// =========================================================================
// Este controlador maneja todas las rutas HTTP relacionadas con
// autenticación y gestión de usuarios
//
// RUTAS BASE: /api/auth (por el prefijo global 'api' en main.ts)
//
// ENDPOINTS DISPONIBLES:
// - POST /api/auth/register  →  Registrar nuevo usuario
//
// ENDPOINTS PENDIENTES:
// - POST /api/auth/login     →  Iniciar sesión
// - GET  /api/auth/profile   →  Obtener perfil del usuario autenticado
// - POST /api/auth/refresh   →  Renovar token JWT

// DECORADOR @ApiTags:
// Agrupa estos endpoints en la sección "Auth" de Swagger UI
// Facilita la navegación en la documentación interactiva
@ApiTags('Auth')
// DECORADOR @Controller:
// Define que esta clase maneja rutas que empiezan con 'auth'
// Ruta completa: /api/auth (por el prefijo global)
@Controller('auth')
export class AuthController {
  // =======================================================================
  // INYECCIÓN DE DEPENDENCIAS
  // =======================================================================
  // NestJS inyecta automáticamente AuthService
  // Esto permite acceder a la lógica de negocio desde el controlador
  constructor(private readonly authService: AuthService) {}

  // =======================================================================
  // ENDPOINT: REGISTRAR NUEVO USUARIO
  // =======================================================================
  // DECORADORES SWAGGER:
  // Documentan las posibles respuestas en Swagger UI
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o email ya registrado',
  })
  // DECORADOR @Post:
  // Define que este método maneja peticiones POST a /auth/register
  @Post('register')
  // PARÁMETROS:
  // @Body() extrae el cuerpo de la petición HTTP
  // createUserDto: CreateUserDto valida automáticamente los datos
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('private')
  @UseGuards(AuthGuard())
  @ApiBearerAuth()
  testingPrivateRoute(
    //@Req() request: Express.Request
    @GetUser() user: User,
    @GetUser('email') userEmail: string,
    //@Headers() headers: IncomingHttpHeaders,
    @RawHeaders() rawHeaders: string[],
  ) {
    return {
      ok: true,
      //user: request.user,
      user,
      userEmail,
      //headers,
      rawHeaders,
      message: 'Hola mundo privado',
    };
  }

  @Get('private2')
  @SetMetadata('roles', ['admin', 'super-user'])
  @UseGuards(AuthGuard(), UserRoleGuard)
  @ApiBearerAuth()
  privateRoute2(@GetUser() user: User) {
    return {
      ok: true,
      user,
    };
  }

  @Get('private3')
  @RoleProtected(ValidRoles.SUPER_USER, ValidRoles.ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  @ApiBearerAuth()
  privateRoute3(@GetUser() user: User) {
    return {
      ok: true,
      user,
    };
  }

  @Get('private4')
  @Auth(ValidRoles.ADMIN, ValidRoles.SUPER_USER)
  @ApiBearerAuth()
  privateRoute4(@GetUser() user: User) {
    return {
      ok: true,
      user,
    };
  }
}
