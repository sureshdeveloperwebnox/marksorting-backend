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
exports.QuickRegisterDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class QuickRegisterDto {
    customer_name;
    customer_id;
    mill_name;
    ref_no;
    frame_no;
    mc_model;
    address;
    place;
    state;
    phone;
    email;
    type;
    invoice_no;
    invoice_date;
    installation_date;
    warranty_years;
    warranty_months;
    amc_starting_date;
    amc_closing_date;
    amc_period;
    amc_amount;
    amc_particulars;
}
exports.QuickRegisterDto = QuickRegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Ravi Kumar', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "customer_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'c10d2e3f-4a5b-6c7d-8e9f-0a1b2c3d4e5f',
        required: false,
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "customer_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Golden Valley Mill' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "mill_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'REF-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "ref_no", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'FN-123456', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "frame_no", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'RX-40 B FOR ZX-40', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "mc_model", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123 Mill Lane, Valley View', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Kurud' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "place", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Chhattisgarh', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+919876543210', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'contact@goldenvalley.com', required: false }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Installation', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'INV-001', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "invoice_no", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15', required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "invoice_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15', required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "installation_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QuickRegisterDto.prototype, "warranty_years", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 12, required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QuickRegisterDto.prototype, "warranty_months", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-02-01', required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "amc_starting_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-02-01', required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "amc_closing_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 12, required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QuickRegisterDto.prototype, "amc_period", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5000, required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QuickRegisterDto.prototype, "amc_amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Annual Maintenance Contract', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickRegisterDto.prototype, "amc_particulars", void 0);
//# sourceMappingURL=quick-register.dto.js.map