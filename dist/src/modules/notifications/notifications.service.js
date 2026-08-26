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
const notification_processor_1 = require("./notification.processor");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    prisma;
    notificationsQueue;
    gateway;
    notificationProcessor;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(prisma, notificationsQueue, gateway, notificationProcessor) {
        this.prisma = prisma;
        this.notificationsQueue = notificationsQueue;
        this.gateway = gateway;
        this.notificationProcessor = notificationProcessor;
    }
    async resolveToUserId(idOrTechId) {
        if (!idOrTechId)
            return null;
        const directUser = await this.prisma.user.findFirst({
            where: {
                id: idOrTechId,
                account_status: 'ACTIVE',
                deleted_at: null,
            },
            select: { id: true },
        });
        if (directUser) {
            return directUser.id;
        }
        const technician = await this.prisma.technician.findFirst({
            where: {
                id: idOrTechId,
                deleted_at: null,
            },
            select: { id: true, email: true, phone: true },
        });
        if (technician) {
            const matchedUser = await this.prisma.user.findFirst({
                where: {
                    account_status: 'ACTIVE',
                    deleted_at: null,
                    OR: [
                        { id: technician.id },
                        ...(technician.email ? [{ email: technician.email }] : []),
                        ...(technician.phone ? [{ phone_number: technician.phone }] : []),
                    ],
                },
                select: { id: true },
            });
            if (matchedUser) {
                return matchedUser.id;
            }
        }
        return null;
    }
    async resolveUserIds(ids) {
        const rawIds = Array.from(new Set((ids || []).filter(Boolean)));
        if (!rawIds.length)
            return [];
        const resolved = await Promise.all(rawIds.map((id) => this.resolveToUserId(id)));
        return Array.from(new Set(resolved.filter((id) => Boolean(id))));
    }
    async createNotification(userIdOrTechId, title, message, type, metaData) {
        if (!userIdOrTechId)
            return null;
        const resolvedUserId = await this.resolveToUserId(userIdOrTechId);
        if (!resolvedUserId) {
            this.logger.warn(`Cannot create notification: Target ID ${userIdOrTechId} could not be resolved to an active user.`);
            return null;
        }
        const notification = await this.prisma.notification.create({
            data: {
                user_id: resolvedUserId,
                title,
                message,
                type,
                status: 'UNREAD',
                meta_data: metaData ?? undefined,
            },
        });
        this.gateway.emitToUser(resolvedUserId, 'notification', notification);
        const recordId = metaData?.storeId ||
            metaData?.reportId ||
            metaData?.expenseId ||
            metaData?.ticketId ||
            metaData?.id ||
            notification.id;
        const pushPayload = {
            id: notification.id,
            recordId,
            userId: resolvedUserId,
            title,
            message,
            type,
            metaData,
        };
        try {
            await this.notificationProcessor.sendPush(pushPayload);
        }
        catch (pushErr) {
            this.logger.warn(`Direct FCM push error for user ${resolvedUserId}, queuing to BullMQ: ${pushErr?.message}`);
            try {
                await this.notificationsQueue.add('send-push', pushPayload, {
                    jobId: `push_${notification.id}_${resolvedUserId}`,
                    removeOnComplete: true,
                    removeOnFail: false,
                    attempts: 2,
                    backoff: { type: 'exponential', delay: 5000 },
                });
            }
            catch (qErr) {
                this.logger.error(`Failed to enqueue push notification job`, qErr);
            }
        }
        return notification;
    }
    async sendToUsers(userIds, title, message, type, metaData) {
        const validUserIds = await this.resolveUserIds(userIds);
        await Promise.all(validUserIds.map((uid) => this.createNotification(uid, title, message, type, metaData)));
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
                role: {
                    name: {
                        in: roleNames,
                        mode: 'insensitive',
                    },
                },
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
                role: {
                    name: {
                        in: [
                            'SUPER_ADMIN',
                            'Super Admin',
                            'super admin',
                            'Admin',
                            'admin',
                            'Manager',
                            'manager',
                        ],
                        mode: 'insensitive',
                    },
                },
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
        const resolvedTechUserIds = await this.resolveUserIds(technicianUserIds || []);
        const resolvedCreatorId = creatorUserId
            ? await this.resolveToUserId(creatorUserId)
            : undefined;
        const recipientIds = new Set([...adminIds, ...resolvedTechUserIds]);
        if (resolvedCreatorId) {
            recipientIds.delete(resolvedCreatorId);
        }
        if (recipientIds.size === 0 && resolvedCreatorId) {
            recipientIds.add(resolvedCreatorId);
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
    async testPushDelivery(targetUserIdOrEmail) {
        let targetUserId = targetUserIdOrEmail;
        if (targetUserIdOrEmail && targetUserIdOrEmail.includes('@')) {
            const u = await this.prisma.user.findFirst({
                where: { email: { equals: targetUserIdOrEmail, mode: 'insensitive' } },
                select: { id: true },
            });
            if (u)
                targetUserId = u.id;
        }
        if (!targetUserId) {
            const latestToken = await this.prisma.pushToken.findFirst({
                orderBy: { updated_at: 'desc' },
                select: { user_id: true, user: { select: { email: true, full_name: true } } },
            });
            if (latestToken)
                targetUserId = latestToken.user_id;
        }
        if (!targetUserId) {
            return {
                success: false,
                message: 'No users with registered FCM push tokens found in database.',
            };
        }
        const user = await this.prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, email: true, full_name: true },
        });
        const tokens = await this.prisma.pushToken.findMany({
            where: { user_id: targetUserId },
            select: { token: true, device_type: true, updated_at: true },
        });
        const pushResult = await this.notificationProcessor.sendPush({
            userId: targetUserId,
            title: '🧪 FCM Test Push Notification',
            message: `Test delivered successfully at ${new Date().toLocaleTimeString()}`,
            type: 'BROADCAST',
            metaData: { isTest: true, timestamp: Date.now() },
        });
        return {
            success: pushResult?.success ?? false,
            targetUser: user,
            registeredTokens: tokens,
            fcmResult: pushResult,
        };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_1.InjectQueue)('notifications')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_2.Queue,
        notifications_gateway_1.NotificationsGateway,
        notification_processor_1.NotificationProcessor])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map