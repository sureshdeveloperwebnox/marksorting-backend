import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';

async function bootstrap() {
  // Multi-channel combination support enabled
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.use(cookieParser());

  // Increase body parser limits for image uploads (50MB for base64 images)
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.use(bodyParser.raw({ limit: '50mb', type: 'application/octet-stream' }));

  // Log all requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
  });

  app.useLogger(app.get(Logger));

  app.useWebSocketAdapter(new IoAdapter(app));

  // Enable CORS
  const extraOrigins = [
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
    process.env.ALLOWED_ORIGINS,
  ]
    .filter(Boolean)
    .flatMap((url) => (url as string).split(',').map((u) => u.trim()));

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (mobile apps, curl, Swagger)
      if (!origin) return callback(null, true);

      // Check if origin matches allowed patterns
      const isLocalOrLan =
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
        /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
        /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(
          origin,
        );

      const isTunnel = /^https:\/\/.*\.ngrok(-free)?\.(app|dev|io)$/.test(origin);

      const isAllowedDomain =
        /^https?:\/\/([a-zA-Z0-9-]+\.)*markcolorsorter\.in(:\d+)?$/.test(origin) ||
        /^https?:\/\/([a-zA-Z0-9-]+\.)*webnoxdigital\.com(:\d+)?$/.test(origin) ||
        /^https?:\/\/([a-zA-Z0-9-]+\.)*marksorting\.com(:\d+)?$/.test(origin);

      const isExplicitEnvAllowed = extraOrigins.some(
        (allowedOrigin) =>
          allowedOrigin === origin ||
          allowedOrigin === origin.replace(/\/$/, ''),
      );

      const allowed =
        isLocalOrLan || isTunnel || isAllowedDomain || isExplicitEnvAllowed;

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

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Mark Sorting Management System API')
    .setDescription('Enterprise-grade API for Mark Sorting Management')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
  console.log(
    `Swagger documentation is available at: http://localhost:${port}/docs`,
  );
}
bootstrap();
