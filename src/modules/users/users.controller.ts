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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Prisma } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('meta/roles')
  @ApiOperation({ summary: 'Get all user roles' })
  @Permissions('users.view')
  getRoles() {
    return this.usersService.getRoles();
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @Permissions('users.view')
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
    description: 'Search term',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'roleId',
    required: false,
    type: String,
    description: 'Filter by role ID',
  })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('roleId') roleId?: string,
  ) {
    const where: Prisma.UserWhereInput = {};

    if (search) {
      const orConditions: Prisma.UserWhereInput[] = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { role: { name: { contains: search, mode: 'insensitive' } } },
      ];

      // Smart phone number normalization: strip spaces and formatting characters (non-digits and non-plus)
      const cleanedPhoneSearch = search.replace(/[^\d+]/g, '');
      if (cleanedPhoneSearch && cleanedPhoneSearch !== '+') {
        orConditions.push({
          phone_number: { contains: cleanedPhoneSearch, mode: 'insensitive' },
        });
      }

      where.OR = orConditions;
    }

    if (status) {
      where.account_status = status;
    }

    if (roleId) {
      where.role_id = roleId;
    }

    return this.usersService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @Permissions('users.view')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  @Permissions('users.create')
  @LogActivity({
    action: ActivityAction.CREATE,
    entityType: 'users',
    description: (ctx) => {
      const user = ctx.result;
      const name = user?.full_name || ctx.body.full_name || 'Unknown';
      const details = [
        user?.email
          ? `Email: ${user.email}`
          : ctx.body.email
            ? `Email: ${ctx.body.email}`
            : null,
        user?.role?.name ? `Role: ${user.role.name}` : null,
        user?.account_status ? `Status: ${user.account_status}` : null,
      ]
        .filter(Boolean)
        .join(', ');
      return createDescription(
        'User',
        name,
        details || undefined,
        ctx.user.full_name,
      );
    },
  })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing user' })
  @Permissions('users.update')
  @LogActivity({
    action: ActivityAction.UPDATE,
    entityType: 'users',
    entityIdParam: 'id',
    description: (ctx) => {
      const before = ctx.result?.before;
      const after = ctx.result?.after;
      const name = after?.full_name || before?.full_name || ctx.params.id;
      const diff =
        before && after ? buildDiffSummary(before, after, ctx.body) : '';
      const who = ctx.user.full_name
        ? `${ctx.user.full_name} updated`
        : 'Updated';
      return diff
        ? `${who} User "${name}" — ${diff}`
        : `${who} User "${name}" (no changes detected)`;
    },
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: any,
  ) {
    const result = await this.usersService.update(id, dto, req.user);
    req.logData = result;
    return result.after;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete user' })
  @Permissions('users.delete')
  @LogActivity({
    action: ActivityAction.DELETE,
    entityType: 'users',
    entityIdParam: 'id',
    description: (ctx) => {
      const user = ctx.result;
      const name = user?.full_name || ctx.params.id;
      const email = user?.email ? ` (${user.email})` : '';
      return deleteDescription('User', `${name}${email}`, ctx.user.full_name);
    },
  })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
