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
exports.MasterMillsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const master_mills_service_1 = require("./master-mills.service");
const create_master_mill_dto_1 = require("./dto/create-master-mill.dto");
const update_master_mill_dto_1 = require("./dto/update-master-mill.dto");
const quick_register_dto_1 = require("./dto/quick-register.dto");
const log_activity_decorator_1 = require("../activity-logs/decorators/log-activity.decorator");
const activity_action_enum_1 = require("../activity-logs/enums/activity-action.enum");
const description_helper_1 = require("../activity-logs/helpers/description.helper");
let MasterMillsController = class MasterMillsController {
    masterMillsService;
    constructor(masterMillsService) {
        this.masterMillsService = masterMillsService;
    }
    findAll(skip, take, search, status, state, allWarranty, millId, type) {
        const where = {};
        if (search) {
            const orConditions = [
                { invoice_no: { contains: search, mode: 'insensitive' } },
                { ref_no: { contains: search, mode: 'insensitive' } },
                { mc_model: { contains: search, mode: 'insensitive' } },
                { frame_no: { contains: search, mode: 'insensitive' } },
                { place: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
                { mill: { name: { contains: search, mode: 'insensitive' } } },
                { mill: { ref_no: { contains: search, mode: 'insensitive' } } },
            ];
            const cleanedPhone = search.replace(/[^\d+]/g, '');
            if (cleanedPhone && cleanedPhone !== '+') {
                orConditions.push({ phone_no: { contains: cleanedPhone, mode: 'insensitive' } });
            }
            where.OR = orConditions;
        }
        if (status)
            where.status = status;
        if (state)
            where.state = state;
        if (allWarranty === 'Under AMC') {
            const now = new Date();
            where.amc_closing_date = { gte: now };
            where.amc_starting_date = { not: null };
        }
        else if (allWarranty) {
            where.all_warranty = allWarranty;
        }
        if (millId)
            where.mill_id = millId;
        if (type)
            where.type = type;
        return this.masterMillsService.findAll({
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined,
            where,
            orderBy: { created_at: 'desc' },
        });
    }
    getStats() {
        return this.masterMillsService.getStats();
    }
    findForPrefill(search, refNo, frameNo) {
        return this.masterMillsService.findForPrefill(search, refNo, frameNo);
    }
    findOne(id) {
        return this.masterMillsService.findById(id);
    }
    create(dto) {
        return this.masterMillsService.create(dto);
    }
    quickRegister(dto) {
        return this.masterMillsService.quickRegister(dto);
    }
    update(id, dto) {
        return this.masterMillsService.update(id, dto);
    }
    remove(id) {
        return this.masterMillsService.remove(id);
    }
};
exports.MasterMillsController = MasterMillsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all master mill records with pagination and filtering' }),
    (0, swagger_1.ApiQuery)({ name: 'skip', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'take', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'state', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'all_warranty', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'mill_id', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, type: String }),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('state')),
    __param(5, (0, common_1.Query)('all_warranty')),
    __param(6, (0, common_1.Query)('mill_id')),
    __param(7, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], MasterMillsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get master mill statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MasterMillsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('prefill'),
    (0, swagger_1.ApiOperation)({ summary: 'Search machine records by Ref No or Frame No for prefilling forms' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'ref_no', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'frame_no', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Matched master mill records' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('ref_no')),
    __param(2, (0, common_1.Query)('frame_no')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], MasterMillsController.prototype, "findForPrefill", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get master mill record by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MasterMillsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new master mill record' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.CREATE,
        entityType: 'master_mills',
        description: (ctx) => {
            const record = ctx.result;
            const invoiceNo = record?.invoice_no || ctx.body.invoice_no || 'Unknown';
            const details = [
                record?.mill?.name ? `Mill: ${record.mill.name}` : null,
                record?.mc_model ? `Model: ${record.mc_model}` : null,
                record?.state ? `State: ${record.state}` : null,
            ]
                .filter(Boolean)
                .join(', ');
            return (0, description_helper_1.createDescription)('Master Mill', invoiceNo, details || undefined, ctx.user.full_name);
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_master_mill_dto_1.CreateMasterMillDto]),
    __metadata("design:returntype", void 0)
], MasterMillsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('quick-register'),
    (0, swagger_1.ApiOperation)({ summary: 'Quick register Customer, Mill, and Master Mill' }),
    (0, swagger_1.ApiBody)({ type: quick_register_dto_1.QuickRegisterDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Quick registration successful' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.CREATE,
        entityType: 'master_mills',
        description: (ctx) => {
            const record = ctx.result;
            const invoiceNo = record?.invoice_no || 'Unknown';
            const details = [
                record?.mill?.name ? `Mill: ${record.mill.name}` : null,
                record?.mc_model ? `Model: ${record.mc_model}` : null,
                record?.state ? `State: ${record.state}` : null,
            ]
                .filter(Boolean)
                .join(', ');
            return (0, description_helper_1.createDescription)('Master Mill (Quick Register)', invoiceNo, details || undefined, ctx.user.full_name);
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [quick_register_dto_1.QuickRegisterDto]),
    __metadata("design:returntype", void 0)
], MasterMillsController.prototype, "quickRegister", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update master mill record' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.UPDATE,
        entityType: 'master_mills',
        entityIdParam: 'id',
        description: (ctx) => {
            const before = ctx.result?.before;
            const after = ctx.result?.after;
            const name = after?.invoice_no || before?.invoice_no || ctx.params.id;
            const diff = before && after ? (0, description_helper_1.buildDiffSummary)(before, after, ctx.body) : '';
            const who = ctx.user.full_name ? `${ctx.user.full_name} updated` : 'Updated';
            return diff
                ? `${who} Master Mill "${name}" — ${diff}`
                : `${who} Master Mill "${name}" (no changes detected)`;
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_master_mill_dto_1.UpdateMasterMillDto]),
    __metadata("design:returntype", void 0)
], MasterMillsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete master mill record' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.DELETE,
        entityType: 'master_mills',
        entityIdParam: 'id',
        description: (ctx) => {
            const record = ctx.result;
            const name = record?.invoice_no || ctx.params.id;
            return (0, description_helper_1.deleteDescription)('Master Mill', name, ctx.user.full_name);
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MasterMillsController.prototype, "remove", null);
exports.MasterMillsController = MasterMillsController = __decorate([
    (0, swagger_1.ApiTags)('master-mills'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('master-mills'),
    __metadata("design:paramtypes", [master_mills_service_1.MasterMillsService])
], MasterMillsController);
//# sourceMappingURL=master-mills.controller.js.map