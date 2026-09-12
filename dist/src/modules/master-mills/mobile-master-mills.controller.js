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
exports.MobileMasterMillsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const master_mills_service_1 = require("./master-mills.service");
const quick_register_dto_1 = require("./dto/quick-register.dto");
let MobileMasterMillsController = class MobileMasterMillsController {
    masterMillsService;
    constructor(masterMillsService) {
        this.masterMillsService = masterMillsService;
    }
    async findForPrefill(search, refNo, frameNo, context) {
        const result = await this.masterMillsService.findForPrefill(search, refNo, frameNo, context);
        if (context && typeof result === 'object' && !Array.isArray(result)) {
            return context === 'service_report'
                ? result.serviceBased
                : result.installationBased;
        }
        return result;
    }
    quickRegister(dto) {
        return this.masterMillsService.quickRegister(dto);
    }
};
exports.MobileMasterMillsController = MobileMasterMillsController;
__decorate([
    (0, common_1.Get)('prefill'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Search machine records by Ref No or Frame No for prefilling forms',
        description: 'Returns a list of matching active Master Mill records with nested Mill and Customer details.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'search',
        required: false,
        type: String,
        description: 'Search term matching Ref No or Frame No (partial)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'ref_no',
        required: false,
        type: String,
        description: 'Specific Ref No to query (partial)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'frame_no',
        required: false,
        type: String,
        description: 'Specific Frame No to query (partial)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'context',
        required: false,
        type: String,
        description: 'Context of the report: service_report or installation_report',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Matched master mill records' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('ref_no')),
    __param(2, (0, common_1.Query)('frame_no')),
    __param(3, (0, common_1.Query)('context')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], MobileMasterMillsController.prototype, "findForPrefill", null);
__decorate([
    (0, common_1.Post)('quick-register'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Quick register Customer, Mill, and Master Mill',
        description: 'Creates or updates Customer, Mill, and Master Mill record based on the payload, ensuring reuse where they already exist.',
    }),
    (0, swagger_1.ApiBody)({ type: quick_register_dto_1.QuickRegisterDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Quick registration successful' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [quick_register_dto_1.QuickRegisterDto]),
    __metadata("design:returntype", void 0)
], MobileMasterMillsController.prototype, "quickRegister", null);
exports.MobileMasterMillsController = MobileMasterMillsController = __decorate([
    (0, swagger_1.ApiTags)('mobile / lookup'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('mobile/master-mills'),
    __metadata("design:paramtypes", [master_mills_service_1.MasterMillsService])
], MobileMasterMillsController);
//# sourceMappingURL=mobile-master-mills.controller.js.map