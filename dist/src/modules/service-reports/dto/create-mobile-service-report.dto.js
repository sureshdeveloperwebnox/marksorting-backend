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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMobileServiceReportDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_service_report_dto_1 = require("./create-service-report.dto");
const class_validator_1 = require("class-validator");
class CreateMobileServiceReportDto extends (0, swagger_1.OmitType)(create_service_report_dto_1.CreateServiceReportDto, ['technician_ids', 'visit_date']) {
    technician_id;
    technician_ids;
    visit_date;
}
exports.CreateMobileServiceReportDto = CreateMobileServiceReportDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        required: false,
        description: 'Single technician UUID assigned to this service report (optional). Used by the mobile client.',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMobileServiceReportDto.prototype, "technician_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'],
        required: false,
        type: [String],
        description: 'Multiple technician UUIDs assigned to this service report (optional).',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('all', { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateMobileServiceReportDto.prototype, "technician_ids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '2024-06-15',
        required: false,
        description: 'Visit date in YYYY-MM-DD format (optional). Defaults to current date if omitted.',
    }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMobileServiceReportDto.prototype, "visit_date", void 0);
//# sourceMappingURL=create-mobile-service-report.dto.js.map