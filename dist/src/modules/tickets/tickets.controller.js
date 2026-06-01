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
exports.TicketsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tickets_service_1 = require("./tickets.service");
const create_ticket_dto_1 = require("./dto/create-ticket.dto");
const update_ticket_dto_1 = require("./dto/update-ticket.dto");
const create_timeline_dto_1 = require("./dto/create-timeline.dto");
const log_activity_decorator_1 = require("../activity-logs/decorators/log-activity.decorator");
const activity_action_enum_1 = require("../activity-logs/enums/activity-action.enum");
const description_helper_1 = require("../activity-logs/helpers/description.helper");
let TicketsController = class TicketsController {
    ticketsService;
    constructor(ticketsService) {
        this.ticketsService = ticketsService;
    }
    findAll(skip, take, search, status, priority) {
        return this.ticketsService.findAll({
            skip: skip ? parseInt(skip, 10) : 0,
            take: take ? parseInt(take, 10) : 10,
            search,
            status,
            priority,
        });
    }
    findOne(id) {
        return this.ticketsService.findById(id);
    }
    create(dto) {
        return this.ticketsService.create(dto);
    }
    update(id, dto) {
        return this.ticketsService.update(id, dto);
    }
    remove(id) {
        return this.ticketsService.remove(id);
    }
    createTimeline(ticketId, dto, req) {
        return this.ticketsService.createTimeline(ticketId, dto, req.user);
    }
    getTimelines(ticketId) {
        return this.ticketsService.getTimelines(ticketId);
    }
};
exports.TicketsController = TicketsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all support tickets with pagination and filtering',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'skip',
        required: false,
        type: String,
        description: 'Number of records to skip',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'take',
        required: false,
        type: String,
        description: 'Number of records to take',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'search',
        required: false,
        type: String,
        description: 'Search query term',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        type: String,
        description: 'Filter by ticket status',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'priority',
        required: false,
        type: String,
        description: 'Filter by ticket priority',
    }),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('priority')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get support ticket by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new support ticket' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.CREATE,
        entityType: 'tickets',
        description: (ctx) => {
            const ticket = ctx.result;
            const title = ticket?.title || ticket?.subject || ctx.body.title || ctx.body.subject || 'Unknown';
            const details = [
                ticket?.priority || ctx.body.priority ? `Priority: ${ticket?.priority || ctx.body.priority}` : null,
                ticket?.status ? `Status: ${ticket.status}` : null,
            ].filter(Boolean).join(', ');
            return (0, description_helper_1.createDescription)('Support Ticket', title, details || undefined, ctx.user.full_name);
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_ticket_dto_1.CreateTicketDto]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update existing support ticket' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.UPDATE,
        entityType: 'tickets',
        entityIdParam: 'id',
        description: (ctx) => {
            const before = ctx.result?.before;
            const after = ctx.result?.after;
            const title = after?.title || after?.subject || before?.title || before?.subject || ctx.params.id;
            const diff = before && after ? (0, description_helper_1.buildDiffSummary)(before, after, ctx.body) : '';
            const who = ctx.user.full_name ? `${ctx.user.full_name} updated` : 'Updated';
            return diff
                ? `${who} Support Ticket "${title}" — ${diff}`
                : `${who} Support Ticket "${title}" (no changes detected)`;
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_ticket_dto_1.UpdateTicketDto]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete support ticket' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.DELETE,
        entityType: 'tickets',
        entityIdParam: 'id',
        description: (ctx) => {
            const ticket = ctx.result;
            const title = ticket?.title || ticket?.subject || ctx.params.id;
            return (0, description_helper_1.deleteDescription)('Support Ticket', title, ctx.user.full_name);
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/timeline'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new timeline entry for a ticket' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.CREATE,
        entityType: 'tickets',
        entityIdParam: 'id',
        description: (ctx) => {
            const who = ctx.user.full_name ? `${ctx.user.full_name}` : 'A user';
            return `${who} added a timeline entry to support ticket #${ctx.params.id}`;
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_timeline_dto_1.CreateTimelineDto, Object]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "createTimeline", null);
__decorate([
    (0, common_1.Get)(':id/timeline'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all timeline entries for a ticket' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "getTimelines", null);
exports.TicketsController = TicketsController = __decorate([
    (0, swagger_1.ApiTags)('tickets'),
    (0, common_1.Controller)('tickets'),
    __metadata("design:paramtypes", [tickets_service_1.TicketsService])
], TicketsController);
//# sourceMappingURL=tickets.controller.js.map