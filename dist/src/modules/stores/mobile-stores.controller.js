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
exports.MobileStoresController = exports.MobileStoreReturnsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const stores_service_1 = require("./stores.service");
const update_store_return_dto_1 = require("./dto/update-store-return.dto");
const mobile_create_store_dto_1 = require("./dto/mobile-create-store.dto");
const mobile_update_store_dto_1 = require("./dto/mobile-update-store.dto");
const log_activity_decorator_1 = require("../activity-logs/decorators/log-activity.decorator");
const activity_action_enum_1 = require("../activity-logs/enums/activity-action.enum");
const description_helper_1 = require("../activity-logs/helpers/description.helper");
let MobileStoreReturnsController = class MobileStoreReturnsController {
    storesService;
    constructor(storesService) {
        this.storesService = storesService;
    }
    findAll(req, skip, take, search) {
        return this.storesService.findPendingByTechnician(req.user.userId, {
            skip: skip ? parseInt(skip, 10) : 0,
            take: take ? parseInt(take, 10) : 10,
            search,
        });
    }
    submitReturn(id, dto, req) {
        return this.storesService.submitReturnDetails(id, req.user.userId, dto);
    }
};
exports.MobileStoreReturnsController = MobileStoreReturnsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] List pending store returns for the logged-in engineer',
        description: 'Returns a list of store records with "Pending" return status assigned to the logged-in technician.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'skip',
        required: false,
        type: String,
        description: 'Offset (default 0)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'take',
        required: false,
        type: String,
        description: 'Page size (default 10)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'search',
        required: false,
        type: String,
        description: 'Search by frame number, barcode or customer name',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated list of pending store returns',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('skip')),
    __param(2, (0, common_1.Query)('take')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], MobileStoreReturnsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Submit store return details',
        description: 'Submits courier/provider name and invoice/receipt number to complete a store return. The status transitions to completed.',
    }),
    (0, swagger_1.ApiBody)({ type: update_store_return_dto_1.UpdateStoreReturnDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Store return completed successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Validation error or status is not Pending',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: "Forbidden from updating another engineer's store record",
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Store record not found' }),
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
                ? `${ctx.user.full_name} completed return`
                : 'Completed return';
            return `${who} for Store Record "Frame ${frame}" — ${diff || 'updated return details'}`;
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_store_return_dto_1.UpdateStoreReturnDto, Object]),
    __metadata("design:returntype", void 0)
], MobileStoreReturnsController.prototype, "submitReturn", null);
exports.MobileStoreReturnsController = MobileStoreReturnsController = __decorate([
    (0, swagger_1.ApiTags)('mobile / store-returns'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('mobile/store-returns'),
    __metadata("design:paramtypes", [stores_service_1.StoresService])
], MobileStoreReturnsController);
let MobileStoresController = class MobileStoresController {
    storesService;
    constructor(storesService) {
        this.storesService = storesService;
    }
    findAll(req, skip, take, search, return_status, returnStatus, inflow_status, inflowStatus, warranty_status, warrantyStatus) {
        return this.storesService.findByTechnician(req.user.userId, {
            skip: skip ? parseInt(skip, 10) : 0,
            take: take ? parseInt(take, 10) : 10,
            search,
            return_status: return_status || returnStatus,
            inflow_status: inflow_status || inflowStatus,
            warranty_status: warranty_status || warrantyStatus,
        });
    }
    submitReturn(id, dto, req) {
        return this.storesService.submitReturnDetails(id, req.user.userId, dto);
    }
    submitReturnAlias(id, dto, req) {
        return this.storesService.submitReturnDetails(id, req.user.userId, dto);
    }
    create(dto, req) {
        return this.storesService.create({
            ...dto,
            service_engineer_id: req.user.userId,
        });
    }
    findOne(id, req) {
        return this.storesService.findByIdAndTechnician(id, req.user.userId);
    }
    update(id, dto, req) {
        return this.storesService.updateByTechnician(id, req.user.userId, dto);
    }
    remove(id, req) {
        return this.storesService.removeByTechnician(id, req.user.userId);
    }
};
exports.MobileStoresController = MobileStoresController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] List store records assigned to the logged-in engineer',
        description: 'Returns a paginated list of store records assigned to the logged-in technician/service engineer, with optional search and status filters.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'skip',
        required: false,
        type: String,
        description: 'Offset (default 0)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'take',
        required: false,
        type: String,
        description: 'Page size (default 10)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'search',
        required: false,
        type: String,
        description: 'Search by frame number, barcode or customer name',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'return_status',
        required: false,
        type: String,
        description: 'Filter by return status (Pending, Returned, Not Returned)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'inflow_status',
        required: false,
        type: String,
        description: 'Filter by inflow status (Inflow, Outflow, Available, Damaged)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'warranty_status',
        required: false,
        type: String,
        description: 'Filter by warranty status (Non Warranty, Supplementary, AMC With Spare, AMC Without Spare)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated list of store records' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('skip')),
    __param(2, (0, common_1.Query)('take')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('return_status')),
    __param(5, (0, common_1.Query)('returnStatus')),
    __param(6, (0, common_1.Query)('inflow_status')),
    __param(7, (0, common_1.Query)('inflowStatus')),
    __param(8, (0, common_1.Query)('warranty_status')),
    __param(9, (0, common_1.Query)('warrantyStatus')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], MobileStoresController.prototype, "findAll", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Submit store return details',
        description: 'Submits courier/provider name and invoice/receipt number to complete a store return.',
    }),
    (0, swagger_1.ApiBody)({ type: update_store_return_dto_1.UpdateStoreReturnDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Store return completed successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Validation error or status is not Pending',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: "Forbidden from updating another engineer's store record",
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Store record not found' }),
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
                ? `${ctx.user.full_name} completed return`
                : 'Completed return';
            return `${who} for Store Record "Frame ${frame}" — ${diff || 'updated return details'}`;
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_store_return_dto_1.UpdateStoreReturnDto, Object]),
    __metadata("design:returntype", void 0)
], MobileStoresController.prototype, "submitReturn", null);
__decorate([
    (0, common_1.Put)(':id/return'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Submit store return details (nested route)',
        description: 'Submits courier/provider name and invoice/receipt number to complete a store return.',
    }),
    (0, swagger_1.ApiBody)({ type: update_store_return_dto_1.UpdateStoreReturnDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Store return completed successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Validation error or status is not Pending',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: "Forbidden from updating another engineer's store record",
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Store record not found' }),
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
                ? `${ctx.user.full_name} completed return`
                : 'Completed return';
            return `${who} for Store Record "Frame ${frame}" — ${diff || 'updated return details'}`;
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_store_return_dto_1.UpdateStoreReturnDto, Object]),
    __metadata("design:returntype", void 0)
], MobileStoresController.prototype, "submitReturnAlias", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Create a new store record for the logged-in engineer',
        description: 'Registers a new store record under the logged-in technician.',
    }),
    (0, swagger_1.ApiBody)({ type: mobile_create_store_dto_1.MobileCreateStoreDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Store record created successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
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
                store?.warranty_status ? `Warranty: ${store.warranty_status}` : null,
            ]
                .filter(Boolean)
                .join(', ');
            return (0, description_helper_1.createDescription)('Store Record', `Frame ${frame}`, details || undefined, ctx.user.full_name);
        },
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mobile_create_store_dto_1.MobileCreateStoreDto, Object]),
    __metadata("design:returntype", void 0)
], MobileStoresController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Get store record by ID',
        description: 'Retrieves the details of a single store record if it belongs to the logged-in technician.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Store record found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden from accessing other engineers records',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Store record not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MobileStoresController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Update store record by ID',
        description: 'Updates a store record if it belongs to the logged-in technician.',
    }),
    (0, swagger_1.ApiBody)({ type: mobile_update_store_dto_1.MobileUpdateStoreDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Store record updated successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden from updating other engineers records',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Store record not found' }),
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
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, mobile_update_store_dto_1.MobileUpdateStoreDto, Object]),
    __metadata("design:returntype", void 0)
], MobileStoresController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Delete store record by ID',
        description: 'Soft deletes a store record if it belongs to the logged-in technician.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Store record deleted successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden from deleting other engineers records',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Store record not found' }),
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
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MobileStoresController.prototype, "remove", null);
exports.MobileStoresController = MobileStoresController = __decorate([
    (0, swagger_1.ApiTags)('mobile / stores'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('mobile/stores'),
    __metadata("design:paramtypes", [stores_service_1.StoresService])
], MobileStoresController);
//# sourceMappingURL=mobile-stores.controller.js.map