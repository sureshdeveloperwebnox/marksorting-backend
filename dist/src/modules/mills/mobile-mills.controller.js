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
exports.MobileMillsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const mills_service_1 = require("./mills.service");
let MobileMillsController = class MobileMillsController {
    millsService;
    constructor(millsService) {
        this.millsService = millsService;
    }
    findAll(customerId, skip, take, search) {
        const where = {};
        if (customerId) {
            where.customer_id = customerId;
        }
        if (search) {
            const orConditions = [
                { name: { contains: search, mode: 'insensitive' } },
                { ref_no: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
                { place: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
            ];
            const cleanedPhone = search.replace(/[^\d+]/g, '');
            if (cleanedPhone && cleanedPhone !== '+') {
                orConditions.push({ phone: { contains: cleanedPhone, mode: 'insensitive' } }, { phone_2: { contains: cleanedPhone, mode: 'insensitive' } }, { phone_3: { contains: cleanedPhone, mode: 'insensitive' } });
            }
            where.OR = orConditions;
        }
        return this.millsService.findAll({
            skip: skip ? parseInt(skip, 10) : 0,
            take: take ? parseInt(take, 10) : 100,
            where,
            orderBy: { name: 'asc' },
        });
    }
    findByCustomer(customerId, search) {
        const where = { customer_id: customerId };
        if (search) {
            const orConditions = [
                { name: { contains: search, mode: 'insensitive' } },
                { ref_no: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
                { place: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
            ];
            const cleanedPhone = search.replace(/[^\d+]/g, '');
            if (cleanedPhone && cleanedPhone !== '+') {
                orConditions.push({ phone: { contains: cleanedPhone, mode: 'insensitive' } }, { phone_2: { contains: cleanedPhone, mode: 'insensitive' } }, { phone_3: { contains: cleanedPhone, mode: 'insensitive' } });
            }
            where.OR = orConditions;
        }
        return this.millsService.findAll({
            skip: 0,
            take: 200,
            where,
            orderBy: { name: 'asc' },
        });
    }
    findOne(id) {
        return this.millsService.findById(id);
    }
};
exports.MobileMillsController = MobileMillsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] List mills with optional customer_id filter',
        description: 'Pass ?customer_id=<uuid> to restrict results to mills belonging to a specific customer. ' +
            'Use this to populate the mill picker dropdown after the engineer selects a customer.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'customer_id',
        required: false,
        type: String,
        description: 'Filter by customer UUID',
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
        description: 'Search by mill name, email, phone, or address',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated list of mills' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    __param(0, (0, common_1.Query)('customer_id')),
    __param(1, (0, common_1.Query)('skip')),
    __param(2, (0, common_1.Query)('take')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], MobileMillsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('by-customer/:customerId'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] List mills belonging to a specific customer',
        description: 'Convenience nested route. Returns all active mills for the given customer UUID. ' +
            'Sorted alphabetically by name.',
    }),
    (0, swagger_1.ApiParam)({ name: 'customerId', description: 'Customer UUID', type: String }),
    (0, swagger_1.ApiQuery)({
        name: 'search',
        required: false,
        type: String,
        description: "Search within the customer's mills",
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of mills for the customer' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], MobileMillsController.prototype, "findByCustomer", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '[Mobile] Get mill details by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Mill UUID', type: String }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Mill details including customer info',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Mill not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MobileMillsController.prototype, "findOne", null);
exports.MobileMillsController = MobileMillsController = __decorate([
    (0, swagger_1.ApiTags)('mobile / lookup'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('mobile/mills'),
    __metadata("design:paramtypes", [mills_service_1.MillsService])
], MobileMillsController);
//# sourceMappingURL=mobile-mills.controller.js.map