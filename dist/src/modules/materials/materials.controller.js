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
exports.MaterialsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const materials_service_1 = require("./materials.service");
const create_material_dto_1 = require("./dto/create-material.dto");
const update_material_dto_1 = require("./dto/update-material.dto");
let MaterialsController = class MaterialsController {
    materialsService;
    constructor(materialsService) {
        this.materialsService = materialsService;
    }
    findAll(skip, take, search, status) {
        const where = {};
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }
        if (status) {
            where.status = status;
        }
        return this.materialsService.findAll({
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined,
            where,
            orderBy: { name: 'asc' },
        });
    }
    findOne(id) {
        return this.materialsService.findById(id);
    }
    create(dto) {
        return this.materialsService.create(dto);
    }
    update(id, dto) {
        return this.materialsService.update(id, dto);
    }
    remove(id) {
        return this.materialsService.remove(id);
    }
};
exports.MaterialsController = MaterialsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all materials with pagination and filtering' }),
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
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], MaterialsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get material by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MaterialsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new material' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_material_dto_1.CreateMaterialDto]),
    __metadata("design:returntype", void 0)
], MaterialsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update existing material' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_material_dto_1.UpdateMaterialDto]),
    __metadata("design:returntype", void 0)
], MaterialsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete material' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MaterialsController.prototype, "remove", null);
exports.MaterialsController = MaterialsController = __decorate([
    (0, swagger_1.ApiTags)('materials'),
    (0, common_1.Controller)('materials'),
    __metadata("design:paramtypes", [materials_service_1.MaterialsService])
], MaterialsController);
//# sourceMappingURL=materials.controller.js.map