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
exports.CreateServiceReportDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class CreateServiceReportDto {
    service_category_id;
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
    nature_of_complaint;
    action_taken;
    engineer_remarks;
    engineer_signature;
    customer_signature;
    mill_email;
    machine_mfg_date;
    machine_installation_date;
    previous_visit_engineer;
    problem_observed;
    commodity;
    contamination;
    output_capacity_per_hour;
    rejection_ratio;
    purity;
    no_of_programs_set;
    ac_provided;
    compressor_details;
    air_drier_details;
    line_filter_condition;
    machine_filter_condition;
    auto_drain_valve_working;
    customer_remarks;
    status;
}
exports.CreateServiceReportDto = CreateServiceReportDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-service-category' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "service_category_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['uuid-of-technician-1', 'uuid-of-technician-2'],
        type: [String],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('all', { each: true }),
    (0, class_validator_1.ArrayMinSize)(1),
    __metadata("design:type", Array)
], CreateServiceReportDto.prototype, "technician_ids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-customer', required: false }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "customer_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-mill' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "mill_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Coimbatore' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "place", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+919876543210' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "mill_whatsapp_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-06-15' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "visit_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '10:30' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "visit_time", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-06-10' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "call_registered_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'MarkSort Pro 500' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "machine_model", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SN-2024-00123' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "serial_or_frame_no", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Rajesh Kumar' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "authorized_person", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Machine not sorting correctly at high speed' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "nature_of_complaint", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Cleaned sensors and recalibrated sorting thresholds',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "action_taken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Machine is now operating within normal parameters' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "engineer_remarks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'data:image/png;base64,...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "engineer_signature", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'data:image/png;base64,...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "customer_signature", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'mill@example.com', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "mill_email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2020-03-01', required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "machine_mfg_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2020-06-15', required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "machine_installation_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Suresh Babu', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "previous_visit_engineer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Vibration noise from sorting chamber',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "problem_observed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Rice', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "commodity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2%', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "contamination", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '500 kg/hr', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "output_capacity_per_hour", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0.5%', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "rejection_ratio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '99.5%', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "purity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5 }),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (typeof value === 'string' && value.trim() !== '') {
            return parseInt(value, 10);
        }
        return value;
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateServiceReportDto.prototype, "no_of_programs_set", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateServiceReportDto.prototype, "ac_provided", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Atlas Copco GA11, 11 kW', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "compressor_details", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Refrigerated type, working fine', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "air_drier_details", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Clean', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "line_filter_condition", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Needs replacement', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "machine_filter_condition", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateServiceReportDto.prototype, "auto_drain_valve_working", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Satisfied with the service', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "customer_remarks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'PENDING',
        enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        required: false,
    }),
    (0, class_validator_1.IsIn)(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateServiceReportDto.prototype, "status", void 0);
//# sourceMappingURL=create-service-report.dto.js.map