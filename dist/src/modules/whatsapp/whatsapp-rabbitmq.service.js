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
var WhatsAppRabbitMQService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppRabbitMQService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqplib_1 = require("amqplib");
let WhatsAppRabbitMQService = WhatsAppRabbitMQService_1 = class WhatsAppRabbitMQService {
    configService;
    logger = new common_1.Logger(WhatsAppRabbitMQService_1.name);
    connection = null;
    channel = null;
    QUEUE_NAME = 'whatsapp_messages';
    DLQ_NAME = 'whatsapp_messages_dlq';
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        await this.connect();
    }
    async onModuleDestroy() {
        await this.disconnect();
    }
    async connect() {
        try {
            const host = this.configService.get('RABBITMQ_HOST', 'localhost');
            const port = this.configService.get('RABBITMQ_PORT', 5672);
            const user = this.configService.get('RABBITMQ_USER', 'admin');
            const pass = this.configService.get('RABBITMQ_PASS', 'admin');
            const amqpUrl = `amqp://${user}:${pass}@${host}:${port}`;
            this.connection = await (0, amqplib_1.connect)(amqpUrl);
            this.channel = await this.connection.createChannel();
            await this.channel.assertQueue(this.QUEUE_NAME, {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': '',
                    'x-dead-letter-routing-key': this.DLQ_NAME,
                    'x-message-ttl': 86400000,
                },
            });
            await this.channel.assertQueue(this.DLQ_NAME, { durable: true });
            await this.channel.prefetch(1);
            this.logger.log('RabbitMQ connected for WhatsApp messaging');
        }
        catch (error) {
            this.logger.error('Failed to connect to RabbitMQ', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            await this.channel?.close();
            await this.connection?.close();
            this.logger.log('RabbitMQ disconnected');
        }
        catch (error) {
            this.logger.error('Error disconnecting from RabbitMQ', error);
        }
    }
    async publishMessage(message) {
        try {
            if (!this.channel) {
                throw new Error('RabbitMQ channel not available');
            }
            const messageWithDefaults = {
                ...message,
                retryCount: message.retryCount || 0,
            };
            const sent = this.channel.sendToQueue(this.QUEUE_NAME, Buffer.from(JSON.stringify(messageWithDefaults)), {
                persistent: true,
                messageId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
            });
            if (sent) {
                this.logger.log(`WhatsApp message queued to ${message.to}: ${message.fileName}`);
            }
            return sent;
        }
        catch (error) {
            this.logger.error(`Failed to publish WhatsApp message to ${message.to}`, error);
            return false;
        }
    }
    async consumeMessages(handler) {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not available');
        }
        await this.channel.consume(this.QUEUE_NAME, async (msg) => {
            if (!msg)
                return;
            try {
                const content = JSON.parse(msg.content.toString());
                this.logger.log(`Processing WhatsApp message to ${content.to}`);
                const success = await handler(content);
                if (success) {
                    this.channel.ack(msg);
                    this.logger.log(`WhatsApp message to ${content.to} processed successfully`);
                }
                else {
                    if ((content.retryCount || 0) < 5) {
                        this.channel.nack(msg, false, true);
                    }
                    else {
                        this.channel.nack(msg, false, false);
                        this.logger.warn(`WhatsApp message to ${content.to} moved to DLQ after max retries`);
                    }
                }
            }
            catch (error) {
                this.logger.error('Error processing WhatsApp message', error);
                this.channel.nack(msg, false, false);
            }
        });
    }
    async getQueueStats() {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not available');
        }
        const { messageCount, consumerCount } = await this.channel.checkQueue(this.QUEUE_NAME);
        return {
            ready: messageCount,
            unacked: 0,
            total: messageCount,
        };
    }
    isConnected() {
        return this.connection !== null && this.channel !== null;
    }
};
exports.WhatsAppRabbitMQService = WhatsAppRabbitMQService;
exports.WhatsAppRabbitMQService = WhatsAppRabbitMQService = WhatsAppRabbitMQService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WhatsAppRabbitMQService);
//# sourceMappingURL=whatsapp-rabbitmq.service.js.map