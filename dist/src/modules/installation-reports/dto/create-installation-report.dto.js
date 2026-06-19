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
exports.CreateInstallationReportDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateInstallationReportDto {
    technician_ids;
    customer_id;
    mill_id;
    place;
    mill_whatsapp_number;
    visit_date;
    visit_time;
    call_registered_date;
    machine_model;
    serial_or_frame_no;
    authorized_person;
    authorized_person_phone;
    invoice_number;
    invoice_date;
    warranty_start_date;
    warranty_end_date;
    commodity;
    contamination;
    output_capacity_per_hour;
    rejection_ratio;
    purity;
    no_of_programs_set;
    ac_provided;
    compressor_details;
    air_drier_details;
    ground_earth_provided;
    running_channel_combination;
    running_channel_combination_value;
    no_of_filters_installed;
    oil_filter_condition;
    line_filter_condition;
    auto_drain_valve_working;
    engineer_remarks;
    engineer_signature;
    customer_signature;
    mill_email;
    customer_remarks;
    status;
}
exports.CreateInstallationReportDto = CreateInstallationReportDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['uuid-of-technician-1', 'uuid-of-technician-2'],
        type: [String],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('all', { each: true }),
    (0, class_validator_1.ArrayMinSize)(1),
    __metadata("design:type", Array)
], CreateInstallationReportDto.prototype, "technician_ids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-customer', required: false }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "customer_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-mill' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "mill_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Coimbatore' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "place", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+919876543210', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "mill_whatsapp_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-05-23' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "visit_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '10:30', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "visit_time", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-05-20' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "call_registered_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'MarkSort Pro 500' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "machine_model", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SN-2026-00123' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "serial_or_frame_no", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Rajesh Kumar' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "authorized_person", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+919876543210', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "authorized_person_phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'IR-INV-100234', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "invoice_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-05-15', required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "invoice_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-05-23', required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "warranty_start_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2027-05-23', required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "warranty_end_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Rice', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "commodity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2%', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "contamination", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '500 kg/hr', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "output_capacity_per_hour", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0.5%', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "rejection_ratio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '99.5%', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "purity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5, required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateInstallationReportDto.prototype, "no_of_programs_set", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateInstallationReportDto.prototype, "ac_provided", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Atlas Copco GA11, 11 kW', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "compressor_details", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Refrigerated type, working fine', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "air_drier_details", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateInstallationReportDto.prototype, "ground_earth_provided", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5, required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateInstallationReportDto.prototype, "running_channel_combination", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'PRIMARY',
        enum: ['PRIMARY', 'SECONDARY', 'REJECTION_1', 'REJECTION_2', 'SPLIT'],
        required: false,
        description: 'Running Channel Combination Value',
    }),
    (0, class_validator_1.IsIn)(['PRIMARY', 'SECONDARY', 'REJECTION_1', 'REJECTION_2', 'SPLIT']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "running_channel_combination_value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3, required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateInstallationReportDto.prototype, "no_of_filters_installed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Good', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "oil_filter_condition", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Clean', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "line_filter_condition", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateInstallationReportDto.prototype, "auto_drain_valve_working", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Machine is now operating within normal parameters' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "engineer_remarks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'data:image/png;base64,...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "engineer_signature", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'data:image/png;base64,...', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "customer_signature", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'mill@example.com', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "mill_email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Satisfied with the installation', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "customer_remarks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'PENDING',
        enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        required: false,
    }),
    (0, class_validator_1.IsIn)(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateInstallationReportDto.prototype, "status", void 0);
//# sourceMappingURL=create-installation-report.dto.js.map