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
        await this.notificationsQueue.add('send-push', { id: notification.id, userId, title, message, type, metaData }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
        return notification;
    }
    async sendToUsers(userIds, title, message, type, metaData) {
        await Promise.all(userIds.map((uid) => this.createNotification(uid, title, message, type, metaData)));
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
    async getUserNotifications(userId, skip = 0, take = 20) {
        const [notifications, total, unreadCount] = await Promise.all([
            this.prisma.notification.findMany({
                where: { user_id: userId },
                orderBy: { created_at: 'desc' },
                skip,
                take,
            }),
            this.prisma.notification.count({ where: { user_id: userId } }),
            this.prisma.notification.count({
                where: { user_id: userId, status: 'UNREAD' },
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
        const recipientIds = new Set([...adminIds, ...technicianUserIds]);
        if (creatorUserId) {
            recipientIds.delete(creatorUserId);
        }
        await this.sendToUsers(Array.from(recipientIds), title, message, type, metaData);
    }
    async registerPushToken(userId, token, deviceType) {
        return this.prisma.pushToken.upsert({
            where: { user_id_token: { user_id: userId, token } },
            create: { user_id: userId, token, device_type: deviceType },
            update: { device_type: deviceType, updated_at: new Date() },
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