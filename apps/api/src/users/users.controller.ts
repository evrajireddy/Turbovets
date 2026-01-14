/**
 * ============================================
 * USERS CONTROLLER
 * ============================================
 * 
 * REST API endpoints for user management.
 * Restricted by role-based access control.
 * 
 * ENDPOINT OVERVIEW:
 * ------------------
 * ┌────────────────────────────────────────────────────────────────┐
 * │ Method │ Endpoint      │ Description    │ Required Role       │
 * ├────────────────────────────────────────────────────────────────┤
 * │ GET    │ /users        │ List users     │ OWNER, ADMIN        │
 * │ GET    │ /users/:id    │ Get user       │ OWNER, ADMIN, Self  │
 * │ POST   │ /users        │ Create user    │ OWNER, ADMIN        │
 * │ PUT    │ /users/:id    │ Update user    │ OWNER, ADMIN, Self  │
 * │ DELETE │ /users/:id    │ Delete user    │ OWNER only          │
 * └────────────────────────────────────────────────────────────────┘
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
  IApiResponse,
  IUserPublic,
  Role,
} from '@libs/data';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  CurrentUser,
} from '@libs/auth';

interface RequestUser {
  id: string;
  email: string;
  role: Role;
  organizationId: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * List all accessible users
   * 
   * @example
   * GET /users?role=ADMIN&page=1&limit=20
   */
  @Get()
  @Roles(Role.OWNER, Role.ADMIN)
  async findAll(
    @Query() query: UserQueryDto,
    @CurrentUser() user: RequestUser,
  ): Promise<IApiResponse<IUserPublic[]>> {
    const { data, total } = await this.usersService.findAll(user, query);
    return {
      success: true,
      data: data as unknown as IUserPublic[],
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 20,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
    };
  }

  /**
   * Get a single user
   * 
   * @example
   * GET /users/123e4567-e89b-12d3-a456-426614174000
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<IApiResponse<IUserPublic>> {
    const foundUser = await this.usersService.findOne(id, user);
    return {
      success: true,
      data: foundUser as unknown as IUserPublic,
    };
  }

  /**
   * Create a new user
   * 
   * @example
   * POST /users
   * Body: { email: 'new@example.com', password: 'Pass123!', firstName: 'John' }
   */
  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: RequestUser,
  ): Promise<IApiResponse<IUserPublic>> {
    const newUser = await this.usersService.create(dto, user);
    return {
      success: true,
      data: newUser as unknown as IUserPublic,
      message: 'User created successfully',
    };
  }

  /**
   * Update a user
   * 
   * @example
   * PUT /users/123e4567-e89b-12d3-a456-426614174000
   * Body: { firstName: 'Jane', role: 'ADMIN' }
   */
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: RequestUser,
  ): Promise<IApiResponse<IUserPublic>> {
    const updated = await this.usersService.update(id, dto, user);
    return {
      success: true,
      data: updated as unknown as IUserPublic,
      message: 'User updated successfully',
    };
  }

  /**
   * Delete (deactivate) a user
   * 
   * @example
   * DELETE /users/123e4567-e89b-12d3-a456-426614174000
   */
  @Delete(':id')
  @Roles(Role.OWNER)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<IApiResponse<null>> {
    await this.usersService.remove(id, user);
    return {
      success: true,
      data: null,
      message: 'User deleted successfully',
    };
  }
}
