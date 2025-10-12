import { Injectable, Logger } from '@nestjs/common';
import { ServerOptions } from 'socket.io';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

@Injectable()
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(redisClient: Redis) {
    const publisher = redisClient;
    const subscriber = redisClient.duplicate();
    try {
      await publisher.connect();
      await subscriber.connect();
    } catch (error) {
      const e = error as Error;
      Logger.error(`Failed to connect with Redis. Cause ${e.message}`);
      throw e;
    }
    this.adapterConstructor = createAdapter(publisher, subscriber);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    Logger.log('Connect to Redis for WebSocket adapter', 'RedisAdapterService');
    return server;
  }
}
