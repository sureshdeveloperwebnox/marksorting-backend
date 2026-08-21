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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_gateway_1 = require("./notifications.gateway");
const register_push_token_dto_1 = require("./dto/register-push-token.dto");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    prisma;
    notificationsQueue;
    gateway;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(prisma, notificationsQueue, gateway) {
        this.prisma = prisma;
        this.notificationsQueue = notificationsQueue;
        this.gateway = gateway;
    }
    async createNotification(userId, title, message, type, metaData) {
        if (!userId)
            return null;
        const userExists = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!userExists) {
            this.logger.warn(`Cannot create notification: User ${userId} does not exist in the database.`);
            return null;
        }
        const notification = await this.prisma.notification.create({
            data: {
                user_id: userId,
                title,
                message,
                type,
                status: 'UNREAD',
                meta_data: metaData ?? undefined,
            },
        });
        this.gateway.emitToUser(userId, 'notification', notification);
        const recordId = metaData?.storeId ||
            metaData?.reportId ||
            metaData?.expenseId ||
            metaData?.ticketId ||
            metaData?.id ||
            notification.id;
        await this.notificationsQueue.add('send-push', {
            id: notification.id,
            recordId,
            userId,
            title,
            message,
            type,
            metaData,
        }, {
            jobId: `push_${notification.id}_${userId}`,
            removeOnComplete: true,
            removeOnFail: false,
            attempts: 2,
            backoff: { type: 'exponential', delay: 5000 },
        });
        return notification;
    }
    async sendToUsers(userIds, title, message, type, metaData) {
        const uniqueUserIds = Array.from(new Set((userIds || []).filter(Boolean)));
        await Promise.all(uniqueUserIds.map((uid) => this.createNotification(uid, title, message, type, metaData)));
    }
    async broadcast(title, message, type, metaData) {
        const users = await this.prisma.user.findMany({
            where: { account_status: 'ACTIVE', deleted_at: null },
            select: { id: true },
        });
        await this.sendToUsers(users.map((u) => u.id), title, message, type, metaData);
    }
    async broadcastToRole(roleName, title, message, type, metaData) {
        await this.broadcastToRoles([roleName], title, message, type, metaData);
    }
    async broadcastToRoles(roleNames, title, message, type, metaData) {
        const users = await this.prisma.user.findMany({
            where: {
                account_status: 'ACTIVE',
                deleted_at: null,
                role: { name: { in: roleNames } },
            },
            select: { id: true },
        });
        await this.sendToUsers(users.map((u) => u.id), title, message, type, metaData);
    }
    async getAdminUserIds() {
        const admins = await this.prisma.user.findMany({
            where: {
                account_status: 'ACTIVE',
                deleted_at: null,
                role: { name: { in: ['SUPER_ADMIN', 'Admin', 'Super Admin'] } },
            },
            select: { id: true },
        });
        return admins.map((a) => a.id);
    }
    async getUserNotifications(userId, skip = 0, take = 20, options) {
        const where = { user_id: userId };
        if (options?.types && options.types.length > 0) {
            where.type = { in: options.types };
        }
        else if (options?.type && options.type !== 'ALL') {
            where.type = options.type;
        }
        if (options?.startDate || options?.endDate) {
            where.created_at = {};
            if (options.startDate) {
                const startStr = options.startDate.includes('T')
                    ? options.startDate
                    : `${options.startDate}T00:00:00.000Z`;
                where.created_at.gte = new Date(startStr);
            }
            if (options.endDate) {
                const endStr = options.endDate.includes('T')
                    ? options.endDate
                    : `${options.endDate}T23:59:59.999Z`;
                where.created_at.lte = new Date(endStr);
            }
        }
        const [notifications, total, unreadCount] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip,
                take,
            }),
            this.prisma.notification.count({ where }),
            this.prisma.notification.count({
                where: { ...where, status: 'UNREAD' },
            }),
        ]);
        return { notifications, total, unreadCount };
    }
    async markAsRead(userId, notificationId) {
        const notification = await this.prisma.notification.findFirst({
            where: { id: notificationId, user_id: userId },
        });
        if (!notification) {
            throw new common_1.NotFoundException('Notification not found');
        }
        return this.prisma.notification.update({
            where: { id: notificationId },
            data: { status: 'READ' },
        });
    }
    async markAllAsRead(userId) {
        return this.prisma.notification.updateMany({
            where: { user_id: userId, status: 'UNREAD' },
            data: { status: 'READ' },
        });
    }
    async notifyStakeholders(technicianUserIds, creatorUserId, title, message, type, metaData) {
        const adminIds = await this.getAdminUserIds();
        const validTechIds = (technicianUserIds || []).filter(Boolean);
        const recipientIds = new Set([...adminIds, ...validTechIds]);
        if (creatorUserId) {
            recipientIds.delete(creatorUserId);
        }
        if (recipientIds.size === 0 && creatorUserId) {
            recipientIds.add(creatorUserId);
        }
        await this.sendToUsers(Array.from(recipientIds), title, message, type, metaData);
    }
    async registerPushToken(userId, token, deviceType) {
        const cleanToken = token?.trim();
        if (!cleanToken || !userId)
            return null;
        await this.prisma.pushToken.deleteMany({
            where: {
                token: cleanToken,
                user_id: { not: userId },
            },
        });
        if (deviceType !== register_push_token_dto_1.DeviceType.WEB) {
            await this.prisma.pushToken.deleteMany({
                where: {
                    user_id: userId,
                    device_type: deviceType,
                    token: { not: cleanToken },
                },
            });
        }
        return this.prisma.pushToken.upsert({
            where: { user_id_token: { user_id: userId, token: cleanToken } },
            create: { user_id: userId, token: cleanToken, device_type: deviceType },
            update: { device_type: deviceType, updated_at: new Date() },
        });
    }
    async removePushToken(userId, token) {
        return this.prisma.pushToken.deleteMany({
            where: { user_id: userId, token },
        });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_1.InjectQueue)('notifications')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_2.Queue,
        notifications_gateway_1.NotificationsGateway])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map