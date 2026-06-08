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
exports.StoresController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const stores_service_1 = require("./stores.service");
const create_store_dto_1 = require("./dto/create-store.dto");
const update_store_dto_1 = require("./dto/update-store.dto");
const log_activity_decorator_1 = require("../activity-logs/decorators/log-activity.decorator");
const activity_action_enum_1 = require("../activity-logs/enums/activity-action.enum");
const description_helper_1 = require("../activity-logs/helpers/description.helper");
let StoresController = class StoresController {
    storesService;
    constructor(storesService) {
        this.storesService = storesService;
    }
    findAll(skip, take, search, serviceEngineerId, customerId, materialId, warrantyStatus, returnStatus, inflowStatus) {
        const where = {};
        if (search) {
            where.OR = [
                { frame_number: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
                {
                    service_engineer: {
                        full_name: { contains: search, mode: 'insensitive' },
                    },
                },
                {
                    customer: {
                        name: { contains: search, mode: 'insensitive' },
                    },
                },
            ];
        }
        if (serviceEngineerId) {
            where.service_engineer_id = serviceEngineerId;
        }
        if (customerId) {
            where.customer_id = customerId;
        }
        if (warrantyStatus) {
            where.warranty_status = warrantyStatus;
        }
        if (returnStatus) {
            where.return_status = returnStatus;
        }
        if (inflowStatus) {
            where.inflow_status = inflowStatus;
        }
        if (materialId) {
            where.materials = {
                some: {
                    material_id: materialId,
                },
            };
        }
        return this.storesService.findAll({
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined,
            where,
            orderBy: { created_at: 'desc' },
        });
    }
    findOne(id) {
        return this.storesService.findById(id);
    }
    create(dto) {
        return this.storesService.create(dto);
    }
    update(id, dto) {
        return this.storesService.update(id, dto);
    }
    remove(id) {
        return this.storesService.remove(id);
    }
};
exports.StoresController = StoresController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all store records with pagination and filtering',
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
        description: 'Search by frame number, barcode, engineer, or customer',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'service_engineer_id',
        required: false,
        type: String,
        description: 'Filter by service engineer UUID',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'customer_id',
        required: false,
        type: String,
        description: 'Filter by customer UUID',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'material_id',
        required: false,
        type: String,
        description: 'Filter by material UUID',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'warranty_status',
        required: false,
        type: String,
        description: 'Filter by warranty status',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'return_status',
        required: false,
        type: String,
        description: 'Filter by return status',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'inflow_status',
        required: false,
        type: String,
        description: 'Filter by inflow/stock status',
    }),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('service_engineer_id')),
    __param(4, (0, common_1.Query)('customer_id')),
    __param(5, (0, common_1.Query)('material_id')),
    __param(6, (0, common_1.Query)('warranty_status')),
    __param(7, (0, common_1.Query)('return_status')),
    __param(8, (0, common_1.Query)('inflow_status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], StoresController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get store record by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StoresController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new store record' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.CREATE,
        entityType: 'stores',
        description: (ctx) => {
            const store = ctx.result;
            const frame = store?.frame_number || ctx.body.frame_number || 'N/A';
            const details = [
                store?.barcode || ctx.body.barcode
                    ? `Barcode: ${store?.barcode || ctx.body.barcode}`
                    : null,
                store?.material?.name ? `Material: ${store.material.name}` : null,
                store?.customer?.name ? `Customer: ${store.customer.name}` : null,
                store?.warranty_status ? `Warranty: ${store.warranty_status}` : null,
            ]
                .filter(Boolean)
                .join(', ');
            return (0, description_helper_1.createDescription)('Store Record', `Frame ${frame}`, details || undefined, ctx.user.full_name);
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_store_dto_1.CreateStoreDto]),
    __metadata("design:returntype", void 0)
], StoresController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update existing store record' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.UPDATE,
        entityType: 'stores',
        entityIdParam: 'id',
        description: (ctx) => {
            const before = ctx.result?.before;
            const after = ctx.result?.after;
            const frame = after?.frame_number || before?.frame_number || ctx.params.id;
            const diff = before && after ? (0, description_helper_1.buildDiffSummary)(before, after, ctx.body) : '';
            const who = ctx.user.full_name
                ? `${ctx.user.full_name} updated`
                : 'Updated';
            return diff
                ? `${who} Store Record "Frame ${frame}" — ${diff}`
                : `${who} Store Record "Frame ${frame}" (no changes detected)`;
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_store_dto_1.UpdateStoreDto]),
    __metadata("design:returntype", void 0)
], StoresController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete store record' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.DELETE,
        entityType: 'stores',
        entityIdParam: 'id',
        description: (ctx) => {
            const store = ctx.result;
            const frame = store?.frame_number || ctx.params.id;
            return (0, description_helper_1.deleteDescription)('Store Record', `Frame ${frame}`, ctx.user.full_name);
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StoresController.prototype, "remove", null);
exports.StoresController = StoresController = __decorate([
    (0, swagger_1.ApiTags)('stores'),
    (0, common_1.Controller)('stores'),
    __metadata("design:paramtypes", [stores_service_1.StoresService])
], StoresController);
//# sourceMappingURL=stores.controller.js.map