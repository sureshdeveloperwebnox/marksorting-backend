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
exports.MobileExpensesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const expenses_service_1 = require("./expenses.service");
const create_mobile_expense_dto_1 = require("./dto/create-mobile-expense.dto");
const update_mobile_expense_dto_1 = require("./dto/update-mobile-expense.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const technicianSchema = {
    type: 'object',
    properties: {
        technician_id: { type: 'string', format: 'uuid' },
        technician: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' },
                full_name: { type: 'string', example: 'Ravi Kumar' },
            },
        },
    },
};
const expenseSchema = {
    type: 'object',
    properties: {
        id: {
            type: 'string',
            format: 'uuid',
            example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        },
        expense_number: { type: 'string', example: 'EXP-20260526-1' },
        mill_id: { type: 'string', format: 'uuid', nullable: true, example: null },
        place: { type: 'string', nullable: true, example: 'Coimbatore' },
        visit_date: {
            type: 'string',
            format: 'date-time',
            example: '2026-05-26T00:00:00.000Z',
        },
        visit_time: { type: 'string', example: '10:30' },
        expense_category_id: {
            type: 'string',
            format: 'uuid',
            example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        },
        others: { type: 'string', nullable: true, example: 'Taxi to mill' },
        amount: { type: 'string', example: '1500' },
        expense_images: { type: 'array', items: { type: 'string' }, example: [] },
        status: {
            type: 'string',
            enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
            example: 'PENDING',
        },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
        deleted_at: { type: 'string', format: 'date-time', nullable: true },
        mill: {
            nullable: true,
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string', example: 'ABC Mill' },
            },
        },
        expenseCategory: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string', example: 'Travel' },
            },
        },
        technicians: {
            type: 'array',
            items: technicianSchema,
        },
    },
};
const paginatedExpensesSchema = {
    type: 'object',
    properties: {
        expenses: { type: 'array', items: expenseSchema },
        total: { type: 'integer', example: 42 },
    },
};
const errorSchema = (message) => ({
    type: 'object',
    properties: {
        statusCode: { type: 'integer' },
        message: { type: 'string', example: message },
    },
});
let MobileExpensesController = class MobileExpensesController {
    expensesService;
    constructor(expensesService) {
        this.expensesService = expensesService;
    }
    findAll(req, skip, take, search, status, dateFrom, dateTo) {
        return this.expensesService.findAll({
            skip: skip ? parseInt(skip, 10) : 0,
            take: take ? parseInt(take, 10) : 10,
            search,
            status,
            dateFrom,
            dateTo,
        }, req.user);
    }
    findOne(id, req) {
        return this.expensesService.findById(id, req.user);
    }
    create(dto, req) {
        return this.expensesService.create(dto, req.user);
    }
    update(id, dto, req) {
        return this.expensesService.update(id, dto, req.user);
    }
    remove(id, req) {
        return this.expensesService.remove(id, req.user);
    }
};
exports.MobileExpensesController = MobileExpensesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] List expenses for the logged-in engineer',
        description: '**Role-based filtering:**\n' +
            '- **Service Engineer** – only expenses they are assigned to are returned.\n' +
            '- **Other roles** (Admin, Manager…) – all expenses are returned.\n\n' +
            'Results are paginated and ordered by `created_at DESC`.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'skip',
        required: false,
        type: Number,
        description: 'Offset — number of records to skip (default `0`)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'take',
        required: false,
        type: Number,
        description: 'Page size — number of records to return (default `10`)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'search',
        required: false,
        type: String,
        description: 'Full-text search across `expense_number`, `place`, `others`, mill name, and category name (case-insensitive)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        description: 'Filter by expense status',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'dateFrom',
        required: false,
        type: String,
        description: 'Visit date lower bound — ISO date string `YYYY-MM-DD`',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'dateTo',
        required: false,
        type: String,
        description: 'Visit date upper bound — ISO date string `YYYY-MM-DD`',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated list of expenses',
        schema: paginatedExpensesSchema,
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Missing or invalid JWT bearer token',
        schema: errorSchema('Unauthorized'),
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('skip')),
    __param(2, (0, common_1.Query)('take')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('dateFrom')),
    __param(6, (0, common_1.Query)('dateTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], MobileExpensesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Get a single expense by ID',
        description: 'Returns full expense detail including assigned technicians, mill, and category.\n\n' +
            'Service Engineers receive **403** if they are not assigned to the expense.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: String,
        format: 'uuid',
        description: 'Expense UUID',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Expense detail',
        schema: expenseSchema,
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Missing or invalid JWT bearer token',
        schema: errorSchema('Unauthorized'),
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Not assigned to this expense',
        schema: errorSchema('You do not have permission to access this expense'),
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Expense not found',
        schema: errorSchema('Expense with ID "..." not found'),
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MobileExpensesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Create a new expense',
        description: 'Creates a new expense record and returns it with all relations populated.\n\n' +
            '**Auto-assignment rule:** When a `Service Engineer` submits this request, their ID is automatically ' +
            'appended to `technician_ids` even if the field is omitted from the payload. ' +
            'You may therefore send a minimal body without `technician_ids` from the mobile app.\n\n' +
            '**Validation:** All referenced IDs (`expense_category_id`, `mill_id`, `technician_ids`) are ' +
            'verified to exist in the database before creation. Invalid IDs return **400**.',
    }),
    (0, swagger_1.ApiBody)({
        type: create_mobile_expense_dto_1.CreateMobileExpenseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Expense created successfully',
        schema: expenseSchema,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Validation error — invalid UUID, missing required field, or referenced entity not found',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'integer', example: 400 },
                message: {
                    oneOf: [
                        {
                            type: 'string',
                            example: 'Expense category with ID "..." not found',
                        },
                        { type: 'string', example: 'Mill with ID "..." not found' },
                        {
                            type: 'string',
                            example: 'One or more technician IDs are invalid',
                        },
                        {
                            type: 'string',
                            example: 'At least one technician ID is required',
                        },
                        {
                            type: 'array',
                            items: { type: 'string' },
                            example: ['visit_date must be a valid ISO 8601 date string'],
                        },
                    ],
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Missing or invalid JWT bearer token',
        schema: errorSchema('Unauthorized'),
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_mobile_expense_dto_1.CreateMobileExpenseDto, Object]),
    __metadata("design:returntype", void 0)
], MobileExpensesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Update an existing expense',
        description: 'Performs a **partial update** — only fields present in the request body are changed.\n\n' +
            'When `technician_ids` is provided, the existing technician assignment list is **fully replaced**.\n\n' +
            'Service Engineers receive **403** if they are not assigned to the expense.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: String,
        format: 'uuid',
        description: 'Expense UUID to update',
    }),
    (0, swagger_1.ApiBody)({
        type: update_mobile_expense_dto_1.UpdateMobileExpenseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Expense updated successfully',
        schema: expenseSchema,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Validation error or invalid reference',
        schema: errorSchema('Expense category with ID "..." not found'),
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Missing or invalid JWT bearer token',
        schema: errorSchema('Unauthorized'),
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Not assigned to this expense',
        schema: errorSchema('You do not have permission to access this expense'),
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Expense not found',
        schema: errorSchema('Expense with ID "..." not found'),
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_mobile_expense_dto_1.UpdateMobileExpenseDto, Object]),
    __metadata("design:returntype", void 0)
], MobileExpensesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Soft-delete an expense',
        description: 'Sets `deleted_at` to the current timestamp — the record is **not** physically removed.\n\n' +
            'Service Engineers receive **403** if they are not assigned to the expense.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: String,
        format: 'uuid',
        description: 'Expense UUID to delete',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Expense soft-deleted — returns the updated record',
        schema: expenseSchema,
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Missing or invalid JWT bearer token',
        schema: errorSchema('Unauthorized'),
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Not assigned to this expense',
        schema: errorSchema('You do not have permission to access this expense'),
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Expense not found',
        schema: errorSchema('Expense with ID "..." not found'),
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MobileExpensesController.prototype, "remove", null);
exports.MobileExpensesController = MobileExpensesController = __decorate([
    (0, swagger_1.ApiTags)('mobile / expenses'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('mobile/expenses'),
    __metadata("design:paramtypes", [expenses_service_1.ExpensesService])
], MobileExpensesController);
//# sourceMappingURL=mobile-expenses.controller.js.map