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
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiBody({
    type: CreateProductDto,
    examples: {
      example1: {
        summary: 'Producto de ejemplo',
        description: 'Ejemplo de un producto típico de la tienda',
        value: {
          title: 'Camiseta Nike Básica',
          price: 29.99,
          description: 'Camiseta de algodón 100% con logo de Nike',
          slug: 'camiseta-nike-basica',
          stock: 50,
          sizes: ['S', 'M', 'L', 'XL'],
          gender: 'unisex',
          tags: ['camiseta', 'nike'],
        },
      },
      example2: {
        summary: 'Producto sin campos opcionales',
        description: 'Ejemplo con solo campos requeridos',
        value: {
          title: 'Zapatos Adidas Running',
          sizes: ['38', '39', '40', '41', '42'],
          gender: 'men',
        },
      },
    },
  })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.productsService.findAll(paginationDto);
  }

  @Get(':term')
  findOne(@Param('term') term: string) {
    return this.productsService.findOne(term);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
