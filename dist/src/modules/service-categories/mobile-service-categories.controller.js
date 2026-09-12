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
exports.MobileServiceCategoriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const service_categories_service_1 = require("./service-categories.service");
let MobileServiceCategoriesController = class MobileServiceCategoriesController {
    serviceCategoriesService;
    constructor(serviceCategoriesService) {
        this.serviceCategoriesService = serviceCategoriesService;
    }
    findAll(skip, take, search) {
        return this.serviceCategoriesService.findAll({
            skip: skip ? parseInt(skip, 10) : 0,
            take: take ? parseInt(take, 10) : 100,
            search,
            status: 'ACTIVE',
        });
    }
};
exports.MobileServiceCategoriesController = MobileServiceCategoriesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] List active service categories for report creation',
        description: 'Returns a paginated list of active service categories. ' +
            'Use this to populate the category selector when creating a service/installation report.',
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
        description: 'Search by category name or description',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated list of service categories',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], MobileServiceCategoriesController.prototype, "findAll", null);
exports.MobileServiceCategoriesController = MobileServiceCategoriesController = __decorate([
    (0, swagger_1.ApiTags)('mobile / lookup'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('mobile/service-categories'),
    __metadata("design:paramtypes", [service_categories_service_1.ServiceCategoriesService])
], MobileServiceCategoriesController);
//# sourceMappingURL=mobile-service-categories.controller.js.map