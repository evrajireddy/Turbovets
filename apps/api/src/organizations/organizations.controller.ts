/**
 * ============================================
 * ORGANIZATIONS CONTROLLER
 * ============================================
 * 
 * REST API for organization management.
 * Most operations restricted to OWNER role.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { IApiResponse, Role } from '@libs/data';
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

interface CreateOrgDto {
  name: string;
  description?: string;
  parentId?: string;
}

interface UpdateOrgDto {
  name?: string;
  description?: string;
}

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  /**
   * Get all accessible organizations
   */
  @Get()
  async findAll(@CurrentUser() user: RequestUser): Promise<IApiResponse<any[]>> {
    const orgs = await this.orgsService.findAll(user);
    return {
      success: true,
      data: orgs,
    };
  }

  /**
   * Get organization hierarchy tree
   */
  @Get('hierarchy')
  async getHierarchy(@CurrentUser() user: RequestUser): Promise<IApiResponse<any[]>> {
    const hierarchy = await this.orgsService.getHierarchy(user);
    return {
      success: true,
      data: hierarchy,
    };
  }

  /**
   * Get a single organization
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<IApiResponse<any>> {
    const org = await this.orgsService.findOne(id, user);
    return {
      success: true,
      data: org,
    };
  }

  /**
   * Create a new organization
   */
  @Post()
  @Roles(Role.OWNER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateOrgDto,
    @CurrentUser() user: RequestUser,
  ): Promise<IApiResponse<any>> {
    const org = await this.orgsService.create(dto, user);
    return {
      success: true,
      data: org,
      message: 'Organization created successfully',
    };
  }

  /**
   * Update an organization
   */
  @Put(':id')
  @Roles(Role.OWNER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrgDto,
    @CurrentUser() user: RequestUser,
  ): Promise<IApiResponse<any>> {
    const org = await this.orgsService.update(id, dto, user);
    return {
      success: true,
      data: org,
      message: 'Organization updated successfully',
    };
  }

  /**
   * Delete an organization
   */
  @Delete(':id')
  @Roles(Role.OWNER)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<IApiResponse<null>> {
    await this.orgsService.remove(id, user);
    return {
      success: true,
      data: null,
      message: 'Organization deleted successfully',
    };
  }
}
