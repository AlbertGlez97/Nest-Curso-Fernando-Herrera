import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { GetUser } from 'src/auth/decorators';
import { User } from 'src/auth/entities/user.entity';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Auth()
  @ApiOperation({
    summary: 'Crear un nuevo producto',
    description:
      'Crea un nuevo producto en la tienda con su información básica e imágenes opcionales',
  })
  @ApiResponse({
    status: 201,
    description: 'Producto creado exitosamente',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Camiseta Nike Básica',
      price: 29.99,
      description: 'Camiseta de algodón 100% con logo de Nike',
      slug: 'camiseta-nike-basica',
      stock: 50,
      sizes: ['S', 'M', 'L', 'XL'],
      gender: 'unisex',
      tags: ['nike', 'algodón'],
      images: ['https://example.com/nike-shirt-1.jpg'],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error de validación o producto duplicado',
    example: {
      statusCode: 400,
      message: [
        'title should not be empty',
        'sizes must be an array',
        'gender must be one of the following values: men, women, kid, unisex',
      ],
      error: 'Bad Request',
    },
  })
  @ApiBody({
    type: CreateProductDto,
    examples: {
      example1: {
        summary: 'Producto completo',
        description: 'Ejemplo de un producto con todos los campos opcionales',
        value: {
          title: 'Camiseta Nike Básica',
          price: 29.99,
          description: 'Camiseta de algodón 100% con logo de Nike',
          slug: 'camiseta-nike-basica',
          stock: 50,
          sizes: ['S', 'M', 'L', 'XL'],
          gender: 'unisex',
          tags: ['nike', 'algodón', 'casual'],
          images: [
            'https://example.com/nike-shirt-1.jpg',
            'https://example.com/nike-shirt-2.jpg',
          ],
        },
      },
      example2: {
        summary: 'Producto mínimo',
        description: 'Ejemplo con solo campos requeridos',
        value: {
          title: 'Zapatos Adidas Running',
          sizes: ['38', '39', '40', '41', '42'],
          gender: 'men',
        },
      },
      example3: {
        summary: 'Producto para mujeres',
        description: 'Ejemplo de producto orientado a mujeres',
        value: {
          title: 'Blusa Elegante',
          price: 45.5,
          description: 'Blusa de seda para ocasiones especiales',
          stock: 25,
          sizes: ['XS', 'S', 'M', 'L'],
          gender: 'women',
          tags: ['elegante', 'seda', 'formal'],
          images: ['https://example.com/blusa-1.jpg'],
        },
      },
    },
  })
  create(@Body() createProductDto: CreateProductDto, @GetUser() user: User) {
    return this.productsService.create(createProductDto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los productos',
    description:
      'Retorna una lista paginada de todos los productos disponibles en la tienda',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos obtenida exitosamente',
    example: [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Camiseta Nike Básica',
        price: 29.99,
        description: 'Camiseta de algodón 100% con logo de Nike',
        slug: 'camiseta-nike-basica',
        stock: 50,
        sizes: ['S', 'M', 'L', 'XL'],
        gender: 'unisex',
        tags: ['nike', 'algodón', 'casual'],
        images: [
          'https://example.com/nike-shirt-1.jpg',
          'https://example.com/nike-shirt-2.jpg',
        ],
      },
    ],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número máximo de productos a retornar (por defecto: 10)',
    example: 10,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Número de productos a saltar (por defecto: 0)',
    example: 0,
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.productsService.findAll(paginationDto);
  }

  @Get(':term')
  @ApiOperation({
    summary: 'Buscar producto por ID, título o slug',
    description:
      'Busca un producto específico usando su UUID, título o slug. La búsqueda por título y slug es case-insensitive.',
  })
  @ApiParam({
    name: 'term',
    description:
      'Término de búsqueda: UUID del producto, título completo o slug',
    examples: {
      uuid: {
        summary: 'Búsqueda por UUID',
        value: '550e8400-e29b-41d4-a716-446655440000',
      },
      title: {
        summary: 'Búsqueda por título',
        value: 'Camiseta Nike Básica',
      },
      slug: {
        summary: 'Búsqueda por slug',
        value: 'camiseta-nike-basica',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado exitosamente',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Camiseta Nike Básica',
      price: 29.99,
      description: 'Camiseta de algodón 100% con logo de Nike',
      slug: 'camiseta-nike-basica',
      stock: 50,
      sizes: ['S', 'M', 'L', 'XL'],
      gender: 'unisex',
      tags: ['nike', 'algodón', 'casual'],
      images: [
        'https://example.com/nike-shirt-1.jpg',
        'https://example.com/nike-shirt-2.jpg',
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado',
    example: {
      statusCode: 404,
      message: 'Product with term "producto-inexistente" not found',
      error: 'Not Found',
    },
  })
  findOne(@Param('term') term: string) {
    return this.productsService.findOnePlain(term);
  }

  @Patch(':id')
  @Auth()
  @ApiOperation({
    summary: 'Actualizar producto existente',
    description:
      'Actualiza parcial o completamente un producto existente. Solo se modifican los campos enviados en el body.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del producto a actualizar',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado exitosamente',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Camiseta Nike Premium',
      price: 39.99,
      description: 'Camiseta de algodón premium con logo de Nike bordado',
      slug: 'camiseta-nike-premium',
      stock: 30,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      gender: 'unisex',
      tags: ['nike', 'premium', 'bordado'],
      images: [
        'https://example.com/nike-premium-1.jpg',
        'https://example.com/nike-premium-2.jpg',
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error de validación en los datos enviados',
    example: {
      statusCode: 400,
      message: [
        'price must be a positive number',
        'gender must be one of the following values: men, women, kid, unisex',
      ],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado',
    example: {
      statusCode: 404,
      message:
        'Product with id: 550e8400-e29b-41d4-a716-446655440000 not found',
      error: 'Not Found',
    },
  })
  @ApiBody({
    type: UpdateProductDto,
    examples: {
      priceUpdate: {
        summary: 'Actualizar solo precio',
        description: 'Ejemplo actualizando únicamente el precio del producto',
        value: {
          price: 35.99,
        },
      },
      fullUpdate: {
        summary: 'Actualización completa',
        description:
          'Ejemplo actualizando múltiples campos incluyendo imágenes',
        value: {
          title: 'Camiseta Nike Premium',
          price: 39.99,
          description: 'Camiseta de algodón premium con logo de Nike bordado',
          stock: 30,
          sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          tags: ['nike', 'premium', 'bordado'],
          images: [
            'https://example.com/nike-premium-1.jpg',
            'https://example.com/nike-premium-2.jpg',
          ],
        },
      },
      imageUpdate: {
        summary: 'Actualizar solo imágenes',
        description: 'Ejemplo reemplazando todas las imágenes del producto',
        value: {
          images: [
            'https://example.com/nueva-imagen-1.jpg',
            'https://example.com/nueva-imagen-2.jpg',
            'https://example.com/nueva-imagen-3.jpg',
          ],
        },
      },
    },
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetUser() user: User,
  ) {
    return this.productsService.update(id, updateProductDto, user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar producto',
    description:
      'Elimina permanentemente un producto y todas sus imágenes asociadas de la base de datos.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del producto a eliminar',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Producto eliminado exitosamente',
    example: {
      raw: [],
      affected: 1,
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado (no se eliminó nada)',
    example: {
      raw: [],
      affected: 0,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'ID inválido (no es un UUID válido)',
    example: {
      statusCode: 400,
      message: 'Validation failed (uuid is expected)',
      error: 'Bad Request',
    },
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
