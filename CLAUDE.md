# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NestJS-based e-commerce API called "Teslo Shop" built with TypeScript, TypeORM, and PostgreSQL. The application provides a REST API for managing products with image support, comprehensive validation, and Swagger documentation.

## Development Commands

### Setup and Installation
```bash
yarn install                    # Install dependencies
cp .env.template .env          # Create environment file
docker-compose up -d           # Start PostgreSQL database
```

### Development
```bash
yarn start:dev                 # Start in development mode with hot reload
yarn start:debug               # Start in debug mode with hot reload
yarn start                     # Start in production mode
yarn build                     # Build the application
```

### Testing and Quality
```bash
yarn test                      # Run unit tests
yarn test:watch                # Run tests in watch mode
yarn test:cov                  # Run tests with coverage
yarn test:e2e                  # Run end-to-end tests
yarn lint                      # Run ESLint with auto-fix
yarn format                    # Format code with Prettier
```

## Architecture

### Core Structure
- **NestJS Modules**: Organized using feature-based modules (Products, Common, Seed, Files, Auth)
- **TypeORM Integration**: PostgreSQL database with entity relationships
- **Validation**: Global ValidationPipe with class-validator DTOs
- **Documentation**: Swagger UI available at `/api/docs`
- **Authentication**: JWT-based authentication with Passport.js

### Database Architecture
The application uses TypeORM with PostgreSQL:

- **Product Entity** (`src/products/entities/product.entity.ts`):
  - UUID primary key
  - Unique title and slug fields
  - Price, stock, sizes (array), gender, tags (array)
  - One-to-many relationship with ProductImage
  - Automatic slug generation from title using @BeforeInsert/@BeforeUpdate hooks

- **ProductImage Entity** (`src/products/entities/product-image.entity.ts`):
  - Many-to-one relationship with Product
  - CASCADE delete when parent product is removed

- **User Entity** (`src/auth/entities/user.entity.ts`):
  - UUID primary key
  - Unique email field (serves as username)
  - Password hashed with bcrypt (salt rounds: 10, select: false by default)
  - Full name for display
  - isActive flag for soft-delete functionality
  - Roles array for RBAC (Role-Based Access Control): ['user', 'admin', 'super-admin']
  - One-to-many relationship with Product

### Validation and DTOs
- **CreateProductDto**: Comprehensive validation with Swagger documentation
- **PaginationDto**: Reusable common DTO for pagination with limit/offset
- All DTOs use class-validator decorators and @ApiProperty for Swagger

### API Configuration
- Global prefix: `/api`
- Swagger UI: `/api/docs`
- Global ValidationPipe with:
  - `whitelist: true` - removes non-DTO properties
  - `forbidNonWhitelisted: true` - throws error for extra properties
  - `transform: true` - auto-transforms to DTO types

## Database Setup

The application requires PostgreSQL running on port 5432. Environment variables needed:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` - PostgreSQL connection
- `HOST_API` - Base URL for the API (used for constructing image URLs)
- `PORT` - Application port
- `JWT_SECRET` - Secret key for JWT token signing (required for authentication)

**Important**: `synchronize: true` is enabled for development but should use migrations in production.

## Module Structure

### Products Module
- **Controller**: CRUD operations with Swagger examples
- **Service**: Business logic with TypeORM repository integration
- **Entities**: Product and ProductImage with proper relationships
- **DTOs**: Comprehensive validation and documentation
- **Exports**: ProductsService and TypeOrmModule are exported for use in other modules (e.g., SeedModule)

### Common Module
- Shared DTOs like PaginationDto
- Reusable utilities across modules

### Seed Module
- Provides seed data endpoint at `/api/seed`
- Uses ProductsService to populate database with initial data

### Files Module
- Handles file uploads and management
- Uses Multer with diskStorage for saving images to `./static/products/`
- Custom fileFilter validates image types (jpg, jpeg, png, gif)
- Custom fileNamer generates unique filenames using UUID
- ServeStaticModule serves files from `public/` directory

### Auth Module
- **Authentication**: User registration and login with JWT tokens
- **Password Security**: bcrypt hashing with 10 salt rounds
- **Authorization**: Role-Based Access Control (RBAC) with roles array
- **JWT Strategy**: Passport.js JWT strategy for protected routes
- **Token Expiration**: 2 hours by default
- **Exports**: TypeOrmModule (User entity), JwtStrategy, PassportModule, JwtModule for use in other modules
- **Endpoints**:
  - POST `/api/auth/register` - Register new user
  - POST `/api/auth/login` - Login and receive JWT token
  - GET `/api/auth/check-status` - Verify JWT and refresh token

## Authentication & Security Patterns

### JWT Authentication Flow
1. User registers or logs in with credentials
2. Server validates credentials and generates JWT token (2h expiration)
3. Client stores token and sends it in Authorization header: `Bearer <token>`
4. Protected routes use `@UseGuards(AuthGuard())` to validate JWT
5. JWT Strategy extracts and validates user from token payload

### Password Security
- Never store plain-text passwords
- bcrypt.hashSync() with 10 salt rounds for hashing
- bcrypt.compareSync() for login validation
- Password field has `select: false` to exclude from normal queries

### Role-Based Access Control (RBAC)
- Users have roles array: `['user', 'admin', 'super-admin']`
- Custom decorators and guards check user roles
- Flexible system allows multiple roles per user

### Soft Delete Pattern
- Users have `isActive: boolean` field instead of hard deletion
- Preserves data integrity and relationships
- Allows account reactivation
- GDPR-compliant approach to account deletion

## Helper Pattern

This codebase uses two patterns for helpers:

### Simple Functions (No @Injectable)
Used when no dependency injection is needed:
- `fileFilter` - Validates image file types
- `fileNamer` - Generates UUID-based filenames
- Import directly without providers registration

### Injectable Classes (@Injectable)
Used when dependencies are needed:
- `ProductImageUrlHelper` - Transforms image URLs using ConfigService
- Must be registered in module providers
- Injected through constructor

## Module Exports and Dependencies

Understanding which modules export what is crucial for avoiding circular dependencies:

- **AuthModule exports**: TypeOrmModule (User entity), JwtStrategy, PassportModule, JwtModule
  - Other modules can import AuthModule to access User repository or use JWT authentication
- **ProductsModule exports**: ProductsService, TypeOrmModule (Product entities)
  - Allows SeedModule to use ProductsService for seeding data
  - Other modules can access Product repository

## Development Notes

- The application uses UUIDs for both Product and User primary keys
- Automatic slug generation from product titles using @BeforeInsert/@BeforeUpdate hooks
- Image URLs are stored as separate entities with cascade deletion
- Products have a many-to-one relationship with Users (each product belongs to a user)
- Comprehensive Swagger documentation with examples
- Spanish comments in codebase (preserve when making changes)
- ValidationPipe transforms query parameters to proper types automatically
- JWT_SECRET environment variable is required and validated on startup
