import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const correlationId = (req as any)['correlationId'] || 'unknown';

    res.on('finish', () => {
      const duration = Date.now() - start;
      const message = `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${correlationId}`;

      if (res.statusCode >= 400) {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }
    });

    next();
  }
}
