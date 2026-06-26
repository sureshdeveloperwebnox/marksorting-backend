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
exports.CreateMasterMillDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const emptyStringToUndefined = (0, class_transformer_1.Transform)(({ value }) => value === '' || value === null ? undefined : value);
class CreateMasterMillDto {
    invoice_no;
    type;
    invoice_date;
    ref_no;
    mill_id;
    address;
    place;
    state;
    phone_no;
    mc_model;
    frame_no;
    warranty_years;
    warranty_months;
    installation_date;
    warranty_start_date;
    warranty_closing_date;
    all_warranty;
    amc_starting_date;
    amc_period;
    amc_particular;
    amc_closing_date;
    amc_amount;
    status;
}
exports.CreateMasterMillDto = CreateMasterMillDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'INV-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMasterMillDto.prototype, "invoice_no", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Installation', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    emptyStringToUndefined,
    __metadata("design:type", String)
], CreateMasterMillDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15', required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    emptyStringToUndefined,
    __metadata("design:type", String)
], CreateMasterMillDto.prototype, "invoice_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'P-0005-17-18', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    emptyStringToUndefined,
    __metadata("design:type", String)
], CreateMasterMillDto.prototype, "ref_no", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-mill', required: false }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    emptyStringToUndefined,
    __metadata("design:type", String)
], CreateMasterMillDto.prototype, "mill_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Old Fatehpura, Udaipur-Jodhpur', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    emptyStringToUndefined,
    __metadata("design:type", String)
], CreateMasterMillDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Udaipur-Jodhpur', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    emptyStringToUndefined,
    __metadata("design:type", String)
], CreateMasterMillDto.prototype, "place", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Rajasthan', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    emptyStringToUndefined,
    __metadata("design:type", String)
], CreateMasterMillDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+919876543210', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    emptyStringToUndefined,
    __metadata("design:type", String)
], CreateMasterMillDto.prototype, "phone_no", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'RX-40 B FOR ZX-40', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    emptyStringToUndefined,
    __metadata("design:type", String)
], CreateMasterMillDto.prototype, "mc_model", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'FN-123456', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    emptyStringToUndefined,
    __metadata("design:type", String)
], CreateMasterMillDto.prototype, "frame_no", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateMasterMillDto.prototype, "warranty_years", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 12, required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateMasterMillDto.prototype, "warranty_months", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15', required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    emptyStringToUndefined,
    __metadata("design:type", String)
], CreateMasterMillDto.prototype, "installation_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15', required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    emptyStringToUndefined,
    __metadata("design:type", String)
], CreateMasterMillDto.prototype, "warranty_start_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-01-15', required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    emptyStringToUndefined,
    __metadata("design:type", String)
], CreateMasterMillDto.prototype, "warranty_closing_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Non Warranty', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    emptyStringToUndefined,
    __metadata("design:type", String)
], CreateMasterMillDto.prototype, "all_warranty", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-01-15', required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    emptyStringToUndefined,
    __metadata("design:type", String)
], CreateMasterMillDto.prototype, "amc_starting_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 12, required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateMasterMillDto.prototype, "amc_period", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Annual Maintenance Contract', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    emptyStringToUndefined,
    __metadata("design:type", String)
], CreateMasterMillDto.prototype, "amc_particular", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-01-15', required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    emptyStringToUndefined,
    __metadata("design:type", String)
], CreateMasterMillDto.prototype, "amc_closing_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5000.0, required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateMasterMillDto.prototype, "amc_amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ACTIVE', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    emptyStringToUndefined,
    __metadata("design:type", String)
], CreateMasterMillDto.prototype, "status", void 0);
//# sourceMappingURL=create-master-mill.dto.js.map