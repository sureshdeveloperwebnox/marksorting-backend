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
exports.ServiceCategoriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const service_categories_service_1 = require("./service-categories.service");
const create_service_category_dto_1 = require("./dto/create-service-category.dto");
const update_service_category_dto_1 = require("./dto/update-service-category.dto");
const log_activity_decorator_1 = require("../activity-logs/decorators/log-activity.decorator");
const activity_action_enum_1 = require("../activity-logs/enums/activity-action.enum");
const description_helper_1 = require("../activity-logs/helpers/description.helper");
let ServiceCategoriesController = class ServiceCategoriesController {
    serviceCategoriesService;
    constructor(serviceCategoriesService) {
        this.serviceCategoriesService = serviceCategoriesService;
    }
    findAll(skip, take, search, status) {
        return this.serviceCategoriesService.findAll({
            skip: skip ? parseInt(skip, 10) : undefined,
            take: take ? parseInt(take, 10) : undefined,
            search,
            status,
        });
    }
    findOne(id) {
        return this.serviceCategoriesService.findById(id);
    }
    create(dto) {
        return this.serviceCategoriesService.create(dto);
    }
    update(id, dto) {
        return this.serviceCategoriesService.update(id, dto);
    }
    remove(id) {
        return this.serviceCategoriesService.remove(id);
    }
};
exports.ServiceCategoriesController = ServiceCategoriesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all service categories with pagination and filtering',
    }),
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
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], ServiceCategoriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get service category by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ServiceCategoriesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new service category' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.CREATE,
        entityType: 'service_categories',
        description: (ctx) => {
            const cat = ctx.result;
            const name = cat?.name || ctx.body.name || 'Unknown';
            const details = ctx.body.description ? `Description: ${ctx.body.description}` : undefined;
            return (0, description_helper_1.createDescription)('Service Category', name, details, ctx.user.full_name);
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_service_category_dto_1.CreateServiceCategoryDto]),
    __metadata("design:returntype", void 0)
], ServiceCategoriesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update existing service category' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.UPDATE,
        entityType: 'service_categories',
        entityIdParam: 'id',
        description: (ctx) => {
            const before = ctx.result?.before;
            const after = ctx.result?.after;
            const name = after?.name || before?.name || ctx.params.id;
            const diff = before && after ? (0, description_helper_1.buildDiffSummary)(before, after, ctx.body) : '';
            const who = ctx.user.full_name ? `${ctx.user.full_name} updated` : 'Updated';
            return diff
                ? `${who} Service Category "${name}" — ${diff}`
                : `${who} Service Category "${name}" (no changes detected)`;
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_service_category_dto_1.UpdateServiceCategoryDto]),
    __metadata("design:returntype", void 0)
], ServiceCategoriesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete service category' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.DELETE,
        entityType: 'service_categories',
        entityIdParam: 'id',
        description: (ctx) => {
            const cat = ctx.result;
            const name = cat?.name || ctx.params.id;
            return (0, description_helper_1.deleteDescription)('Service Category', name, ctx.user.full_name);
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ServiceCategoriesController.prototype, "remove", null);
exports.ServiceCategoriesController = ServiceCategoriesController = __decorate([
    (0, swagger_1.ApiTags)('service-categories'),
    (0, common_1.Controller)('service-categories'),
    __metadata("design:paramtypes", [service_categories_service_1.ServiceCategoriesService])
], ServiceCategoriesController);
//# sourceMappingURL=service-categories.controller.js.map