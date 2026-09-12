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
exports.CreateMobileTicketDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_ticket_dto_1 = require("./create-ticket.dto");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
class CreateMobileTicketDto extends (0, swagger_1.OmitType)(create_ticket_dto_1.CreateTicketDto, [
    'service_engineer_id',
]) {
    service_engineer_id;
}
exports.CreateMobileTicketDto = CreateMobileTicketDto;
__decorate([
    (0, swagger_2.ApiProperty)({
        example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        required: false,
        description: 'Single technician / service engineer UUID assigned to this support ticket (optional). ' +
            'If not provided, the logged-in engineer ID is automatically assigned.',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMobileTicketDto.prototype, "service_engineer_id", void 0);
//# sourceMappingURL=create-mobile-ticket.dto.js.map