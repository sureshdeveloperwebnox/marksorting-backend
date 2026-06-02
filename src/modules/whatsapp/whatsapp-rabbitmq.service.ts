import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChannelModel, Channel, connect, ConsumeMessage } from 'amqplib';

export interface WhatsAppQueueMessage {
  to: string;
  documentUrl: string;
  fileName: string;
  caption?: string;
  reportId?: string;
  reportType?: 'SERVICE' | 'INSTALLATION';
  retryCount?: number;
}

@Injectable()
export class WhatsAppRabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsAppRabbitMQService.name);
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private readonly QUEUE_NAME = 'whatsapp_messages';
  private readonly DLQ_NAME = 'whatsapp_messages_dlq';

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      const host = this.configService.get<string>('RABBITMQ_HOST', 'localhost');
      const port = this.configService.get<number>('RABBITMQ_PORT', 5672);
      const user = this.configService.get<string>('RABBITMQ_USER', 'admin');
      const pass = this.configService.get<string>('RABBITMQ_PASS', 'admin');

      const amqpUrl = `amqp://${user}:${pass}@${host}:${port}`;
      
      this.connection = await connect(amqpUrl);
      if (!this.connection) {
        throw new Error('Failed to establish RabbitMQ connection');
      }
      this.channel = await this.connection.createChannel();

      // Assert main queue with dead letter exchange
      await this.channel.assertQueue(this.QUEUE_NAME, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': this.DLQ_NAME,
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      // Assert dead letter queue
      await this.channel.assertQueue(this.DLQ_NAME, { durable: true });

      // Limit prefetch to control rate (1 message per 2 seconds for WhatsApp rate limiting)
      await this.channel.prefetch(1);

      this.logger.log('RabbitMQ connected for WhatsApp messaging');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  private async disconnect(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.logger.log('RabbitMQ disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error);
    }
  }

  /**
   * Publish WhatsApp message to RabbitMQ queue
   */
  async publishMessage(message: WhatsAppQueueMessage): Promise<boolean> {
    try {
      if (!this.channel) {
        throw new Error('RabbitMQ channel not available');
      }

      const messageWithDefaults: WhatsAppQueueMessage = {
        ...message,
        retryCount: message.retryCount || 0,
      };

      const sent = this.channel.sendToQueue(
        this.QUEUE_NAME,
        Buffer.from(JSON.stringify(messageWithDefaults)),
        {
          persistent: true,
          messageId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        },
      );

      if (sent) {
        this.logger.log(`WhatsApp message queued to ${message.to}: ${message.fileName}`);
      }

      return sent;
    } catch (error) {
      this.logger.error(`Failed to publish WhatsApp message to ${message.to}`, error);
      return false;
    }
  }

  /**
   * Consume messages from the queue
   */
  async consumeMessages(
    handler: (message: WhatsAppQueueMessage) => Promise<boolean>,
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    await this.channel.consume(this.QUEUE_NAME, async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const content: WhatsAppQueueMessage = JSON.parse(msg.content.toString());
        this.logger.log(`Processing WhatsApp message to ${content.to}`);

        const success = await handler(content);

        if (success) {
          this.channel!.ack(msg);
          this.logger.log(`WhatsApp message to ${content.to} processed successfully`);
        } else {
          // Requeue with retry logic
          if ((content.retryCount || 0) < 5) {
            this.channel!.nack(msg, false, true);
          } else {
            this.channel!.nack(msg, false, false); // Send to DLQ
            this.logger.warn(`WhatsApp message to ${content.to} moved to DLQ after max retries`);
          }
        }
      } catch (error) {
        this.logger.error('Error processing WhatsApp message', error);
        this.channel!.nack(msg, false, false); // Send to DLQ
      }
    });
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{ ready: number; unacked: number; total: number }> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const { messageCount, consumerCount } = await this.channel.checkQueue(this.QUEUE_NAME);
    return {
      ready: messageCount,
      unacked: 0, // Would need management API for this
      total: messageCount,
    };
  }

  /**
   * Check connection health
   */
  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }
}
