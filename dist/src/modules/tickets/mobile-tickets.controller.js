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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileTicketsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tickets_service_1 = require("./tickets.service");
const create_mobile_ticket_dto_1 = require("./dto/create-mobile-ticket.dto");
const update_mobile_ticket_dto_1 = require("./dto/update-mobile-ticket.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const ticketSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', format: 'uuid', example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
        ticket_number: { type: 'string', example: 'TKT-20260601-ABCDEF' },
        user_id: { type: 'string', format: 'uuid', nullable: true, example: null },
        service_engineer_id: { type: 'string', format: 'uuid', nullable: true, example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
        customer_id: { type: 'string', format: 'uuid', nullable: true, example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
        mill_id: { type: 'string', format: 'uuid', nullable: true, example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
        subject: { type: 'string', example: 'Printer issue' },
        description: { type: 'string', example: 'Sorting machine printer is offline.' },
        status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED'], example: 'OPEN' },
        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], example: 'MEDIUM' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
        service_engineer: {
            type: 'object',
            nullable: true,
            properties: {
                id: { type: 'string', format: 'uuid' },
                full_name: { type: 'string', example: 'Ravi Kumar' },
                email: { type: 'string', example: 'engineer@marksorting.com' },
                phone: { type: 'string', example: '+919876543210' },
                status: { type: 'string', example: 'AVAILABLE' },
            },
        },
        customer: {
            type: 'object',
            nullable: true,
            properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string', example: 'ABC Mill Group' },
                email: { type: 'string', example: 'customer@example.com' },
                phone: { type: 'string', example: '+919988776655' },
            },
        },
        mill: {
            type: 'object',
            nullable: true,
            properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string', example: 'ABC Rice Mill' },
            },
        },
    },
};
const paginatedTicketsSchema = {
    type: 'object',
    properties: {
        tickets: { type: 'array', items: ticketSchema },
        total: { type: 'integer', example: 1 },
    },
};
const errorSchema = (message) => ({
    type: 'object',
    properties: {
        statusCode: { type: 'integer' },
        message: { type: 'string', example: message },
    },
});
let MobileTicketsController = class MobileTicketsController {
    ticketsService;
    constructor(ticketsService) {
        this.ticketsService = ticketsService;
    }
    findAll(req, skip, take, search, status, priority) {
        return this.ticketsService.findAll({
            skip: skip ? parseInt(skip, 10) : 0,
            take: take ? parseInt(take, 10) : 10,
            search,
            status,
            priority,
        }, req.user);
    }
    findOne(id, req) {
        return this.ticketsService.findById(id, req.user);
    }
    create(dto, req) {
        return this.ticketsService.create(dto, req.user);
    }
    update(id, dto, req) {
        return this.ticketsService.update(id, dto, req.user);
    }
    remove(id, req) {
        return this.ticketsService.remove(id, req.user);
    }
};
exports.MobileTicketsController = MobileTicketsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] List support tickets for the logged-in engineer',
        description: '**Role-based filtering:**\n' +
            '- **Service Engineer** – only tickets they are assigned to as `service_engineer_id` are returned.\n' +
            '- **Other roles** (Admin, Manager…) – all tickets are returned.\n\n' +
            'Results are paginated and ordered by `created_at DESC`.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'skip', required: false, type: Number, description: 'Offset — number of records to skip (default `0`)' }),
    (0, swagger_1.ApiQuery)({ name: 'take', required: false, type: Number, description: 'Page size — number of records to return (default `10`)' }),
    (0, swagger_1.ApiQuery)({
        name: 'search',
        required: false,
        type: String,
        description: 'Full-text search across ticket number, subject, description, customer name, and mill name',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED'],
        description: 'Filter by ticket status',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'priority',
        required: false,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        description: 'Filter by ticket priority',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated list of support tickets', schema: paginatedTicketsSchema }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT bearer token', schema: errorSchema('Unauthorized') }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('skip')),
    __param(2, (0, common_1.Query)('take')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('priority')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], MobileTicketsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Get a single support ticket by ID',
        description: 'Returns full support ticket details including assigned service engineer, customer, and mill.\n\n' +
            'Service Engineers receive **403** if they are not assigned to the ticket.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, format: 'uuid', description: 'Ticket UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Support ticket details', schema: ticketSchema }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT bearer token', schema: errorSchema('Unauthorized') }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Not assigned to this ticket', schema: errorSchema('You do not have permission to access this ticket') }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Ticket not found', schema: errorSchema('Support ticket with ID "..." not found') }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MobileTicketsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Create a new support ticket',
        description: 'Creates a new support ticket and returns it.\n\n' +
            '**Auto-assignment rule:** When a `Service Engineer` submits this request, their ID is automatically ' +
            'assigned as the `service_engineer_id` even if omitted from the payload.\n\n' +
            '**Validation:** Referenced technician, customer, and mill IDs are validated to exist. ' +
            'Also validates that the selected mill belongs to the selected customer.',
    }),
    (0, swagger_1.ApiBody)({ type: create_mobile_ticket_dto_1.CreateMobileTicketDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Support ticket created successfully', schema: ticketSchema }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error or relation validation failed', schema: errorSchema('Service engineer not found') }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT bearer token', schema: errorSchema('Unauthorized') }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_mobile_ticket_dto_1.CreateMobileTicketDto, Object]),
    __metadata("design:returntype", void 0)
], MobileTicketsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Update an existing support ticket',
        description: 'Performs a **partial update** — only fields present in the request body are changed.\n\n' +
            'Service Engineers receive **403** if they are not assigned to the ticket. ' +
            'They cannot reassign the ticket to another engineer (assignment is forced to their own ID).',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, format: 'uuid', description: 'Ticket UUID to update' }),
    (0, swagger_1.ApiBody)({ type: update_mobile_ticket_dto_1.UpdateMobileTicketDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Support ticket updated successfully', schema: { type: 'object', properties: { before: ticketSchema, after: ticketSchema } } }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error or relation validation failed', schema: errorSchema('Selected mill does not belong to the selected customer') }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT bearer token', schema: errorSchema('Unauthorized') }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Not assigned to this ticket', schema: errorSchema('You do not have permission to access this ticket') }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Ticket not found', schema: errorSchema('Support ticket with ID "..." not found') }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_mobile_ticket_dto_1.UpdateMobileTicketDto, Object]),
    __metadata("design:returntype", void 0)
], MobileTicketsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Delete a support ticket',
        description: 'Deletes a support ticket record.\n\n' +
            'Service Engineers receive **403** if they are not assigned to the ticket.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, format: 'uuid', description: 'Ticket UUID to delete' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Support ticket deleted successfully', schema: ticketSchema }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT bearer token', schema: errorSchema('Unauthorized') }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Not assigned to this ticket', schema: errorSchema('You do not have permission to access this ticket') }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Ticket not found', schema: errorSchema('Support ticket with ID "..." not found') }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MobileTicketsController.prototype, "remove", null);
exports.MobileTicketsController = MobileTicketsController = __decorate([
    (0, swagger_1.ApiTags)('mobile / tickets'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('mobile/tickets'),
    __metadata("design:paramtypes", [tickets_service_1.TicketsService])
], MobileTicketsController);
//# sourceMappingURL=mobile-tickets.controller.js.map