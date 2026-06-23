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
exports.MobileCustomersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const customers_service_1 = require("./customers.service");
let MobileCustomersController = class MobileCustomersController {
    customersService;
    constructor(customersService) {
        this.customersService = customersService;
    }
    findAll(skip, take, search, status) {
        const where = {};
        if (search) {
            const orConditions = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
                { mills: { some: { name: { contains: search, mode: 'insensitive' } } } },
            ];
            const cleanedPhone = search.replace(/[^\d+]/g, '');
            if (cleanedPhone && cleanedPhone !== '+' && cleanedPhone.length >= 5) {
                orConditions.push({
                    phone: { contains: cleanedPhone, mode: 'insensitive' },
                });
            }
            where.OR = orConditions;
        }
        where.status = status || 'ACTIVE';
        return this.customersService.findAll({
            skip: skip ? parseInt(skip, 10) : 0,
            take: take ? parseInt(take, 10) : 100,
            where,
            orderBy: { name: 'asc' },
        });
    }
};
exports.MobileCustomersController = MobileCustomersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] List customers for picker dropdown',
        description: 'Returns a paginated list of active customers. ' +
            'Use this to populate the customer selector before picking a mill.',
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
        description: 'Page size (default 100)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'search',
        required: false,
        type: String,
        description: 'Search by customer name',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        type: String,
        description: 'Filter by status (default ACTIVE)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated list of customers' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], MobileCustomersController.prototype, "findAll", null);
exports.MobileCustomersController = MobileCustomersController = __decorate([
    (0, swagger_1.ApiTags)('mobile / lookup'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('mobile/customers'),
    __metadata("design:paramtypes", [customers_service_1.CustomersService])
], MobileCustomersController);
//# sourceMappingURL=mobile-customers.controller.js.map