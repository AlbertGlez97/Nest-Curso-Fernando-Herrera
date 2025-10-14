import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginUserDto {
  // =======================================================================
  // EMAIL - CORREO ELECTRÓNICO DEL USUARIO
  // =======================================================================
  @ApiProperty({
    description: 'Correo electrónico del usuario (único en el sistema)',
    example: 'user@example.com',
    uniqueItems: true,
  })
  // VALIDACIÓN: Debe ser un string
  @IsString()
  // VALIDACIÓN: Debe ser un email válido (formato: xxx@xxx.xxx)
  // Usa una expresión regular interna para validar formato de email
  @IsEmail()
  // TRANSFORMACIÓN: Normaliza el email antes de guardarlo
  // - toLowerCase(): Convierte a minúsculas para evitar duplicados
  //   "User@Example.COM" → "user@example.com"
  // - trim(): Elimina espacios en blanco al inicio y final
  //   " user@example.com " → "user@example.com"
  //
  // ⚠️ IMPORTANTE: Esta transformación solo funciona si
  // ValidationPipe tiene { transform: true } en main.ts
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  // =======================================================================
  // PASSWORD - CONTRASEÑA DEL USUARIO
  // =======================================================================
  @ApiProperty({
    description:
      'Contraseña del usuario (mínimo 6 caracteres, debe contener mayúsculas, minúsculas y números)',
    example: 'MyPassword123',
    minLength: 6,
    maxLength: 50,
  })
  // VALIDACIÓN: Debe ser un string
  @IsString()
  // VALIDACIÓN: Longitud mínima de 6 caracteres
  // Previene contraseñas débiles como "123"
  @MinLength(6)
  // VALIDACIÓN: Longitud máxima de 50 caracteres
  // Previene ataques DoS con contraseñas extremadamente largas
  @MaxLength(50)
  // VALIDACIÓN: Expresión regular para política de contraseña fuerte
  //
  // REGEX EXPLICADA:
  // (?=.*\d)|(?=.*\W+)  → Debe contener AL MENOS UN dígito O un carácter especial
  // (?![.\n])           → No debe contener punto seguido de salto de línea
  // (?=.*[A-Z])         → Debe contener AL MENOS UNA letra mayúscula
  // (?=.*[a-z])         → Debe contener AL MENOS UNA letra minúscula
  // .*$                 → Cualquier carácter hasta el final
  //
  // EJEMPLOS VÁLIDOS:
  // ✅ "Password123"     - Tiene mayúscula, minúscula y número
  // ✅ "MyPass1"         - Cumple todos los requisitos
  // ✅ "Test@Pass"       - Tiene mayúscula, minúscula y carácter especial
  //
  // EJEMPLOS INVÁLIDOS:
  // ❌ "password"        - No tiene mayúscula ni número
  // ❌ "PASSWORD123"     - No tiene minúscula
  // ❌ "Password"        - No tiene número ni carácter especial
  // ❌ "12345"           - Solo números
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'The password must have a Uppercase, lowercase letter and a number',
  })
  password: string;
}
