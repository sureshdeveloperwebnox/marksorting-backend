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
exports.UpdateStoreReturnDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpdateStoreReturnDto {
    provider_name;
    invoice_number;
    remarks;
    return_status;
    courier_photos;
    products;
}
exports.UpdateStoreReturnDto = UpdateStoreReturnDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'DHL Express',
        description: 'Name of the provider/courier',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateStoreReturnDto.prototype, "provider_name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'INV-987654',
        description: 'Return shipment invoice / tracking number',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateStoreReturnDto.prototype, "invoice_number", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '(Serial Nos: MAIN BOARD: [BAR-001 (USED)])',
        description: 'Remarks and serial number breakdown',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateStoreReturnDto.prototype, "remarks", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Returned',
        description: 'Return status (e.g. Returned, Completed, In Progress)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateStoreReturnDto.prototype, "return_status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Courier photos list',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateStoreReturnDto.prototype, "courier_photos", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Products / barcode remarks details list',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateStoreReturnDto.prototype, "products", void 0);
//# sourceMappingURL=update-store-return.dto.js.map