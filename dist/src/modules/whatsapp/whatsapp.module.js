"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("../../prisma/prisma.module");
const whatsapp_service_1 = require("./whatsapp.service");
const whatsapp_processor_1 = require("./whatsapp.processor");
const whatsapp_rabbitmq_service_1 = require("./whatsapp-rabbitmq.service");
const whatsapp_rabbitmq_processor_1 = require("./whatsapp-rabbitmq.processor");
let WhatsAppModule = class WhatsAppModule {
};
exports.WhatsAppModule = WhatsAppModule;
exports.WhatsAppModule = WhatsAppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            prisma_module_1.PrismaModule,
            axios_1.HttpModule.register({
                timeout: 30000,
                maxRedirects: 5,
            }),
            bullmq_1.BullModule.registerQueue({
                name: 'whatsapp',
                defaultJobOptions: {
                    attempts: 5,
                    backoff: {
                        type: 'exponential',
                        delay: 10000,
                    },
                    removeOnComplete: {
                        age: 86400,
                        count: 1000,
                    },
                    removeOnFail: {
                        age: 604800,
                        count: 500,
                    },
                },
            }),
        ],
        providers: [
            whatsapp_service_1.WhatsAppService,
            whatsapp_processor_1.WhatsAppProcessor,
            whatsapp_rabbitmq_service_1.WhatsAppRabbitMQService,
            whatsapp_rabbitmq_processor_1.WhatsAppRabbitMQProcessor,
        ],
        exports: [whatsapp_service_1.WhatsAppService, whatsapp_rabbitmq_service_1.WhatsAppRabbitMQService],
    })
], WhatsAppModule);
//# sourceMappingURL=whatsapp.module.js.map