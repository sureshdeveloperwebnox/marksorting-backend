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
exports.MobileCreateStoreDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class MobileCreateStoreDto {
    customer_id;
    material_ids;
    material_quantities;
    quantity;
    warranty_status;
    frame_number;
    return_status;
    inflow_status;
    barcode;
    provider_name;
    invoice_number;
}
exports.MobileCreateStoreDto = MobileCreateStoreDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-of-customer' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MobileCreateStoreDto.prototype, "customer_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['uuid-of-material-1', 'uuid-of-material-2'] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)(undefined, { each: true }),
    (0, class_validator_1.ArrayMinSize)(1),
    __metadata("design:type", Array)
], MobileCreateStoreDto.prototype, "material_ids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: [{ material_id: 'uuid-of-material-1', quantity: 2 }],
        required: false,
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], MobileCreateStoreDto.prototype, "material_quantities", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], MobileCreateStoreDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Supplementary' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MobileCreateStoreDto.prototype, "warranty_status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'FRM10245' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MobileCreateStoreDto.prototype, "frame_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Pending' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MobileCreateStoreDto.prototype, "return_status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Inflow' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MobileCreateStoreDto.prototype, "inflow_status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'BAR1234567', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MobileCreateStoreDto.prototype, "barcode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'DHL', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MobileCreateStoreDto.prototype, "provider_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'INV-12345', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MobileCreateStoreDto.prototype, "invoice_number", void 0);
//# sourceMappingURL=mobile-create-store.dto.js.map