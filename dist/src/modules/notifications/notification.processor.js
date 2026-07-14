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
var NotificationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
let NotificationProcessor = NotificationProcessor_1 = class NotificationProcessor extends bullmq_1.WorkerHost {
    configService;
    prisma;
    logger = new common_1.Logger(NotificationProcessor_1.name);
    firebaseApp = null;
    firebaseInitialized = false;
    firebaseMockMode = false;
    constructor(configService, prisma) {
        super();
        this.configService = configService;
        this.prisma = prisma;
    }
    initFirebase() {
        if (this.firebaseInitialized)
            return;
        const projectId = this.configService.get('firebase.projectId');
        const clientEmail = this.configService.get('firebase.clientEmail');
        const privateKey = this.configService.get('firebase.privateKey');
        if (!projectId || !clientEmail || !privateKey) {
            this.logger.warn('Firebase credentials not provided. Running in Mock Mode for push notifications.');
            this.firebaseMockMode = true;
            this.firebaseInitialized = true;
            return;
        }
        try {
            const admin = require('firebase-admin');
            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey: privateKey.replace(/\\n/g, '\n'),
                    }),
                });
            }
            this.firebaseApp = admin;
            this.logger.log('Firebase Admin SDK initialized successfully.');
        }
        catch (err) {
            this.logger.error('Failed to initialize Firebase Admin SDK', err);
            this.firebaseMockMode = true;
        }
        this.firebaseInitialized = true;
    }
    async process(job) {
        if (job.name === 'send-push') {
            await this.handleSendPush(job);
        }
    }
    async handleSendPush(job) {
        this.initFirebase();
        const { id, userId, title, message, type } = job.data;
        if (this.firebaseMockMode) {
            this.logger.log(`[Mock FCM] Would send push to user ${userId}: "${title}" - "${message}" (type: ${type}, id: ${id})`);
            return;
        }
        const pushTokens = await this.prisma.pushToken.findMany({
            where: { user_id: userId },
            select: { token: true },
        });
        if (!pushTokens.length)
            return;
        const tokens = pushTokens.map((pt) => pt.token);
        try {
            const response = await this.firebaseApp.messaging().sendEachForMulticast({
                tokens,
                notification: { title, body: message },
                data: {
                    id: String(id || ''),
                    type: String(type || ''),
                    ...(job.data.metaData
                        ? Object.fromEntries(Object.entries(job.data.metaData).map(([k, v]) => [k, String(v)]))
                        : {}),
                },
            });
            this.logger.log(`Successfully sent FCM push to user ${userId} with ${tokens.length} tokens. Success count: ${response.successCount}, Failure count: ${response.failureCount}`);
            const failed = response.responses
                .map((r, i) => (!r.success ? tokens[i] : null))
                .filter(Boolean);
            if (failed.length > 0) {
                await this.prisma.pushToken.deleteMany({
                    where: { token: { in: failed } },
                });
                this.logger.warn(`Removed ${failed.length} invalid FCM tokens.`);
            }
        }
        catch (err) {
            this.logger.error(`Failed to send FCM push for user ${userId}`, err);
            throw err;
        }
    }
};
exports.NotificationProcessor = NotificationProcessor;
exports.NotificationProcessor = NotificationProcessor = NotificationProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('notifications'),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], NotificationProcessor);
//# sourceMappingURL=notification.processor.js.map