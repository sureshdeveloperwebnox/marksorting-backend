import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { Prisma } from '@prisma/client';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { LogActivity } from '../activity-logs/decorators/log-activity.decorator';
import { ActivityAction } from '../activity-logs/enums/activity-action.enum';
import {
  createDescription,
  updateDescription,
  deleteDescription,
  buildDiffSummary,
} from '../activity-logs/helpers/description.helper';

@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles with pagination and filtering' })
  @Permissions('roles.view')
  @ApiQuery({
    name: 'skip',
    required: false,
    type: String,
    description: 'Number of records to skip',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: String,
    description: 'Number of records to take',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search query',
  })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    const where: Prisma.RoleWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.rolesService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  @Get('meta/permissions')
  @ApiOperation({ summary: 'Get all available permissions' })
  @Permissions('roles.view')
  getAllPermissions() {
    return this.rolesService.getAllPermissions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  @Permissions('roles.view')
  findOne(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new role' })
  @Permissions('roles.create')
  @LogActivity({
    action: ActivityAction.CREATE,
    entityType: 'roles',
    description: (ctx) => {
      const role = ctx.result;
      const name = role?.name || ctx.body.name || 'Unknown';
      const details = [
        ctx.body.description ? `Description: ${ctx.body.description}` : null,
        Array.isArray(ctx.body.permissions)
          ? `Permissions: ${ctx.body.permissions.length} assigned`
          : null,
      ]
        .filter(Boolean)
        .join(', ');
      return createDescription(
        'Role',
        name,
        details || undefined,
        ctx.user.full_name,
      );
    },
  })
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing role' })
  @Permissions('roles.update')
  @LogActivity({
    action: ActivityAction.UPDATE,
    entityType: 'roles',
    entityIdParam: 'id',
    description: (ctx) => {
      const before = ctx.result?.before;
      const after = ctx.result?.after;
      const name = after?.name || before?.name || ctx.params.id;
      const diff =
        before && after ? buildDiffSummary(before, after, ctx.body) : '';
      const permNote = Array.isArray(ctx.body.permission_ids)
        ? ` | Permissions: ${ctx.body.permission_ids.length} assigned`
        : '';
      const who = ctx.user.full_name
        ? `${ctx.user.full_name} updated`
        : 'Updated';
      return diff
        ? `${who} Role "${name}" — ${diff}${permNote}`
        : `${who} Role "${name}"${permNote || ' (no changes detected)'}`;
    },
  })
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role' })
  @Permissions('roles.delete')
  @LogActivity({
    action: ActivityAction.DELETE,
    entityType: 'roles',
    entityIdParam: 'id',
    description: (ctx) => {
      const role = ctx.result;
      const name = role?.name || ctx.params.id;
      return deleteDescription('Role', name, ctx.user.full_name);
    },
  })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
