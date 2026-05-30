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
var NotificationsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
let NotificationsGateway = NotificationsGateway_1 = class NotificationsGateway {
    jwtService;
    configService;
    server;
    logger = new common_1.Logger(NotificationsGateway_1.name);
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async handleConnection(client) {
        try {
            const cookieHeader = client.handshake.headers?.cookie || '';
            const cookieToken = cookieHeader
                .split(';')
                .map((c) => c.trim())
                .find((c) => c.startsWith('access_token='))
                ?.split('=')[1];
            const token = cookieToken ||
                client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('jwt.secret'),
            });
            client.data.userId = payload.sub;
            client.join(`user:${payload.sub}`);
            this.logger.log(`Client connected: ${client.id} for user ${payload.sub}`);
        }
        catch {
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handlePing(client) {
        return { event: 'pong', data: 'pong' };
    }
    emitToUser(userId, event, data) {
        this.server.to(`user:${userId}`).emit(event, data);
    }
    emitToAll(event, data) {
        this.server.emit(event, data);
    }
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handlePing", null);
exports.NotificationsGateway = NotificationsGateway = NotificationsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: (origin, callback) => {
                if (!origin)
                    return callback(null, true);
                const allowed = /^http:\/\/localhost(:\d+)?$/.test(origin) ||
                    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
                    /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
                    /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
                    /^https:\/\/.*\.ngrok(-free)?\.(app|dev|io)$/.test(origin) ||
                    origin === 'https://adminmarksorter.webnoxdigital.com' ||
                    origin === 'https://apimarksorter.webnoxdigital.com';
                callback(allowed ? null : new Error('Not allowed by CORS'), allowed);
            },
            credentials: true,
        },
        namespace: '/notifications',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map