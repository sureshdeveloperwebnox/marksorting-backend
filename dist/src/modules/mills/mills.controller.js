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
exports.MillsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const mills_service_1 = require("./mills.service");
const create_mill_dto_1 = require("./dto/create-mill.dto");
const update_mill_dto_1 = require("./dto/update-mill.dto");
const log_activity_decorator_1 = require("../activity-logs/decorators/log-activity.decorator");
const activity_action_enum_1 = require("../activity-logs/enums/activity-action.enum");
const description_helper_1 = require("../activity-logs/helpers/description.helper");
let MillsController = class MillsController {
    millsService;
    constructor(millsService) {
        this.millsService = millsService;
    }
    findAll(skip, take, search, status, customerId) {
        const where = {};
        if (search) {
            const orConditions = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
            ];
            const cleanedPhoneSearch = search.replace(/[^\d+]/g, '');
            if (cleanedPhoneSearch && cleanedPhoneSearch !== '+') {
                orConditions.push({
                    phone: { contains: cleanedPhoneSearch, mode: 'insensitive' },
                });
            }
            where.OR = orConditions;
        }
        if (status) {
            where.status = status;
        }
        if (customerId) {
            where.customer_id = customerId;
        }
        return this.millsService.findAll({
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined,
            where,
            orderBy: { created_at: 'desc' },
        });
    }
    findOne(id) {
        return this.millsService.findById(id);
    }
    create(dto) {
        return this.millsService.create(dto);
    }
    update(id, dto) {
        console.log(`[MillsController] UPDATE called: id=${id}, name=${dto.name}`);
        return this.millsService.update(id, dto);
    }
    remove(id) {
        return this.millsService.remove(id);
    }
};
exports.MillsController = MillsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all mills with pagination and filtering' }),
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
        description: 'Search query',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        type: String,
        description: 'Filter by status',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'customer_id',
        required: false,
        type: String,
        description: 'Filter by customer UUID',
    }),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('customer_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], MillsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get mill by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MillsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new mill' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.CREATE,
        entityType: 'mills',
        description: (ctx) => {
            const mill = ctx.result;
            const name = mill?.name || ctx.body.name || 'Unknown';
            const details = [
                mill?.customer?.name ? `Customer: ${mill.customer.name}` : null,
                mill?.email ? `Email: ${mill.email}` : null,
                mill?.phone ? `Phone: ${mill.phone}` : null,
                mill?.status ? `Status: ${mill.status}` : null,
            ].filter(Boolean).join(', ');
            return (0, description_helper_1.createDescription)('Mill', name, details || undefined, ctx.user.full_name);
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_mill_dto_1.CreateMillDto]),
    __metadata("design:returntype", void 0)
], MillsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update existing mill' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.UPDATE,
        entityType: 'mills',
        entityIdParam: 'id',
        description: (ctx) => {
            const before = ctx.result?.before;
            const after = ctx.result?.after;
            const name = after?.name || before?.name || ctx.params.id;
            const diff = before && after ? (0, description_helper_1.buildDiffSummary)(before, after, ctx.body) : '';
            const who = ctx.user.full_name ? `${ctx.user.full_name} updated` : 'Updated';
            return diff
                ? `${who} Mill "${name}" — ${diff}`
                : `${who} Mill "${name}" (no changes detected)`;
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_mill_dto_1.UpdateMillDto]),
    __metadata("design:returntype", void 0)
], MillsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete mill' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.DELETE,
        entityType: 'mills',
        entityIdParam: 'id',
        description: (ctx) => {
            const mill = ctx.result;
            const name = mill?.name || ctx.params.id;
            return (0, description_helper_1.deleteDescription)('Mill', name, ctx.user.full_name);
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MillsController.prototype, "remove", null);
exports.MillsController = MillsController = __decorate([
    (0, swagger_1.ApiTags)('mills'),
    (0, common_1.Controller)('mills'),
    __metadata("design:paramtypes", [mills_service_1.MillsService])
], MillsController);
//# sourceMappingURL=mills.controller.js.map