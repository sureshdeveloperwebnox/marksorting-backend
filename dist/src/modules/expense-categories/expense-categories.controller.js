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
exports.ExpenseCategoriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const expense_categories_service_1 = require("./expense-categories.service");
const create_expense_category_dto_1 = require("./dto/create-expense-category.dto");
const update_expense_category_dto_1 = require("./dto/update-expense-category.dto");
let ExpenseCategoriesController = class ExpenseCategoriesController {
    expenseCategoriesService;
    constructor(expenseCategoriesService) {
        this.expenseCategoriesService = expenseCategoriesService;
    }
    findAll(skip, take, search, status) {
        return this.expenseCategoriesService.findAll({
            skip: skip ? parseInt(skip, 10) : undefined,
            take: take ? parseInt(take, 10) : undefined,
            search,
            status,
        });
    }
    findOne(id) {
        return this.expenseCategoriesService.findById(id);
    }
    create(dto) {
        return this.expenseCategoriesService.create(dto);
    }
    update(id, dto) {
        return this.expenseCategoriesService.update(id, dto);
    }
    remove(id) {
        return this.expenseCategoriesService.remove(id);
    }
};
exports.ExpenseCategoriesController = ExpenseCategoriesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all expense categories with pagination and filtering',
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
], ExpenseCategoriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get expense category by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExpenseCategoriesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new expense category' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_expense_category_dto_1.CreateExpenseCategoryDto]),
    __metadata("design:returntype", void 0)
], ExpenseCategoriesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update existing expense category' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_expense_category_dto_1.UpdateExpenseCategoryDto]),
    __metadata("design:returntype", void 0)
], ExpenseCategoriesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete expense category' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExpenseCategoriesController.prototype, "remove", null);
exports.ExpenseCategoriesController = ExpenseCategoriesController = __decorate([
    (0, swagger_1.ApiTags)('expense-categories'),
    (0, common_1.Controller)('expense-categories'),
    __metadata("design:paramtypes", [expense_categories_service_1.ExpenseCategoriesService])
], ExpenseCategoriesController);
//# sourceMappingURL=expense-categories.controller.js.map