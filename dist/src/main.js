"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const nestjs_pino_1 = require("nestjs-pino");
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const app_module_1 = require("./app.module");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const body_parser_1 = __importDefault(require("body-parser"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: true });
    app.use((0, cookie_parser_1.default)());
    app.use(body_parser_1.default.json({ limit: '50mb' }));
    app.use(body_parser_1.default.urlencoded({ limit: '50mb', extended: true }));
    app.use(body_parser_1.default.raw({ limit: '50mb', type: 'application/octet-stream' }));
    app.use((req, res, next) => {
        console.log(`[REQUEST] ${req.method} ${req.url}`);
        next();
    });
    app.useLogger(app.get(nestjs_pino_1.Logger));
    app.useWebSocketAdapter(new platform_socket_io_1.IoAdapter(app));
    const extraOrigins = [
        process.env.FRONTEND_URL,
        process.env.CORS_ORIGIN,
        process.env.ALLOWED_ORIGINS,
    ]
        .filter(Boolean)
        .flatMap((url) => url.split(',').map((u) => u.trim()));
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            const isLocalOrLan = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
                /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
                /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
                /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin);
            const isTunnel = /^https:\/\/.*\.ngrok(-free)?\.(app|dev|io)$/.test(origin);
            const isAllowedDomain = /^https?:\/\/([a-zA-Z0-9-]+\.)*markcolorsorter\.in(:\d+)?$/.test(origin) ||
                /^https?:\/\/([a-zA-Z0-9-]+\.)*webnoxdigital\.com(:\d+)?$/.test(origin) ||
                /^https?:\/\/([a-zA-Z0-9-]+\.)*marksorting\.com(:\d+)?$/.test(origin);
            const isExplicitEnvAllowed = extraOrigins.some((allowedOrigin) => allowedOrigin === origin ||
                allowedOrigin === origin.replace(/\/$/, ''));
            const allowed = isLocalOrLan || isTunnel || isAllowedDomain || isExplicitEnvAllowed;
            callback(null, allowed);
        },
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Accept',
            'Authorization',
            'X-Requested-With',
            'Origin',
            'Access-Control-Request-Method',
            'Access-Control-Request-Headers',
        ],
        exposedHeaders: ['Content-Range', 'X-Content-Range', 'Content-Disposition'],
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Mark Sorting Management System API')
        .setDescription('Enterprise-grade API for Mark Sorting Management')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = process.env.PORT || 4000;
    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on: http://localhost:${port}/api/v1`);
    console.log(`Swagger documentation is available at: http://localhost:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map