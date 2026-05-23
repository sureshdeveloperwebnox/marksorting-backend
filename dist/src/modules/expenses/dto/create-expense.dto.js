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
exports.CreateExpenseDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateExpenseDto {
    technician_ids;
    mill_id;
    place;
    visit_date;
    visit_time;
    expense_type;
    others;
    amount;
    expense_images;
    status;
}
exports.CreateExpenseDto = CreateExpenseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['uuid-of-technician-1', 'uuid-of-technician-2'],
        type: [String],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('all', { each: true }),
    (0, class_validator_1.ArrayMinSize)(1),
    __metadata("design:type", Array)
], CreateExpenseDto.prototype, "technician_ids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-mill', required: false }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "mill_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Coimbatore', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "place", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-05-23' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "visit_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '10:30' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "visit_time", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'TRAVEL' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "expense_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Taxi to mill', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "others", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1500, required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateExpenseDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['expense-image-key-1.jpg', 'expense-image-key-2.jpg'],
        type: [String],
        required: false,
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateExpenseDto.prototype, "expense_images", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'PENDING',
        enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        required: false,
    }),
    (0, class_validator_1.IsIn)(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "status", void 0);
//# sourceMappingURL=create-expense.dto.js.map