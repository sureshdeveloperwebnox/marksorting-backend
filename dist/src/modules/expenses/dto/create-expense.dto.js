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
    customer_id;
    mill_id;
    place;
    visit_date;
    visit_time;
    expense_category_id;
    others;
    amount;
    expense_images;
    status;
}
exports.CreateExpenseDto = CreateExpenseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'],
        type: [String],
        required: false,
        description: 'List of technician UUIDs assigned to this expense. ' +
            "On the mobile endpoint a Service Engineer's own ID is automatically appended, " +
            'so this field may be omitted from the mobile request body.',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('all', { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateExpenseDto.prototype, "technician_ids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        required: false,
        description: 'UUID of the customer associated with this expense (optional). Used for client payload compatibility and stripped before DB insert.',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "customer_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        required: false,
        description: 'UUID of the mill associated with this expense (optional).',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "mill_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Coimbatore',
        required: false,
        description: "Free-text location where the expense was incurred. Auto-populated from the selected mill's address if available.",
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "place", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '2026-05-26',
        description: 'Date of the site visit — ISO 8601 date string (YYYY-MM-DD). **Required.**',
    }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "visit_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '10:30',
        description: 'Time of the site visit in HH:MM 24-hour format. **Optional.**',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "visit_time", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        description: 'UUID of the expense category (e.g. Travel, Food, Accommodation). **Required.** ' +
            'The category must exist and not be soft-deleted — an invalid ID returns 400.',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "expense_category_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Taxi from railway station to mill site',
        required: false,
        description: 'Additional remarks or description about the expense (e.g. vendor name, hotel details).',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "others", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 1500,
        required: false,
        minimum: 0,
        description: 'Expense amount in INR (₹). Defaults to `0` if omitted. Must be ≥ 0.',
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateExpenseDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['receipts/2026/05/receipt-001.jpg'],
        type: [String],
        required: false,
        description: 'Array of S3/storage object keys for uploaded receipt images. ' +
            'Use the file-upload endpoint to obtain object keys before submitting.',
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
        description: 'Expense workflow status. Defaults to `PENDING` on creation.\n\n' +
            '| Value | Meaning |\n' +
            '|---|---|\n' +
            '| `PENDING` | Submitted, awaiting review |\n' +
            '| `IN_PROGRESS` | Under review / partially processed |\n' +
            '| `COMPLETED` | Approved and settled |\n' +
            '| `CANCELLED` | Cancelled before settlement |',
    }),
    (0, class_validator_1.IsIn)(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateExpenseDto.prototype, "status", void 0);
//# sourceMappingURL=create-expense.dto.js.map