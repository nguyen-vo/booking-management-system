import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisProvider implements OnModuleInit {
  private _client: Redis;
  private _isReady = false;

  constructor() {
    try {
      this._client = new Redis({
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        lazyConnect: true,
        password: process.env.REDIS_PASSWORD || undefined,
        retryStrategy: (times) => {
          Logger.error(`Redis reconnect attempt #${times}`);
          const delayOneSecond = 1000;
          if (times >= 10) {
            Logger.error('Max Redis reconnect attempts reached. Giving up.');
            process.exit(1);
          }
          return delayOneSecond;
        },
        showFriendlyErrorStack: true,
      });
    } catch (error) {
      console.error('Error initializing Redis client:', error);
      throw error;
    }
  }

  async onModuleInit() {
    await this.waitForConnection();
  }

  private async waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._client.once('ready', () => {
        this._isReady = true;
        console.log('Redis connection established');
        resolve();
      });

      this._client.once('error', (error) => {
        console.error('Redis connection error:', error);
        reject(error);
      });

      if (this._client.status === 'ready') {
        this._isReady = true;
        resolve();
      }
    });
  }

  duplicate(): Redis {
    return this._client.duplicate();
  }

  get client(): Redis {
    return this._client;
  }

  get isReady(): boolean {
    return this._isReady;
  }
}
