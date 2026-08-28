"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const log_activity_decorator_1 = require("../activity-logs/decorators/log-activity.decorator");
const activity_action_enum_1 = require("../activity-logs/enums/activity-action.enum");
const description_helper_1 = require("../activity-logs/helpers/description.helper");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    getRoles() {
        return this.usersService.getRoles();
    }
    findAll(skip, take, search, status, roleId) {
        const where = {};
        if (search) {
            const orConditions = [
                { full_name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { role: { name: { contains: search, mode: 'insensitive' } } },
            ];
            const cleanedPhoneSearch = search.replace(/[^\d+]/g, '');
            if (cleanedPhoneSearch &&
                cleanedPhoneSearch !== '+' &&
                cleanedPhoneSearch.length >= 5) {
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
    findOne(id) {
        return this.usersService.findById(id);
    }
    create(dto) {
        return this.usersService.create(dto);
    }
    async update(id, dto, req) {
        const result = await this.usersService.update(id, dto, req.user);
        req.logData = result;
        return result.after;
    }
    remove(id) {
        return this.usersService.remove(id);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('meta/roles'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all user roles' }),
    (0, permissions_decorator_1.Permissions)('users.view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getRoles", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users with pagination and filtering' }),
    (0, permissions_decorator_1.Permissions)('users.view'),
    (0, swagger_1.ApiQuery)({
        name: 'skip',
        required: false,
        type: String,
        description: 'Number of records to skip',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'take',
        required: false,
        type: String,
        description: 'Number of records to take',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'search',
        required: false,
        type: String,
        description: 'Search term',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        type: String,
        description: 'Filter by status',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'roleId',
        required: false,
        type: String,
        description: 'Filter by role ID',
    }),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('roleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID' }),
    (0, permissions_decorator_1.Permissions)('users.view'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new user' }),
    (0, permissions_decorator_1.Permissions)('users.create'),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.CREATE,
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
            return (0, description_helper_1.createDescription)('User', name, details || undefined, ctx.user.full_name);
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update existing user' }),
    (0, permissions_decorator_1.Permissions)('users.update'),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.UPDATE,
        entityType: 'users',
        entityIdParam: 'id',
        description: (ctx) => {
            const before = ctx.result?.before;
            const after = ctx.result?.after;
            const name = after?.full_name || before?.full_name || ctx.params.id;
            const diff = before && after ? (0, description_helper_1.buildDiffSummary)(before, after, ctx.body) : '';
            const who = ctx.user.full_name
                ? `${ctx.user.full_name} updated`
                : 'Updated';
            return diff
                ? `${who} User "${name}" — ${diff}`
                : `${who} User "${name}" (no changes detected)`;
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete user' }),
    (0, permissions_decorator_1.Permissions)('users.delete'),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.DELETE,
        entityType: 'users',
        entityIdParam: 'id',
        description: (ctx) => {
            const user = ctx.result;
            const name = user?.full_name || ctx.params.id;
            const email = user?.email ? ` (${user.email})` : '';
            return (0, description_helper_1.deleteDescription)('User', `${name}${email}`, ctx.user.full_name);
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "remove", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map