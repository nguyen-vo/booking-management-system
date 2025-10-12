import { Injectable, Scope } from '@nestjs/common';
import { RedisProvider } from '../redis-connection/redis-connection.provider';

@Injectable({ scope: Scope.DEFAULT })
export class RedisCacheService {
  constructor(private readonly redisProvider: RedisProvider) {}

  async zadd(key: string, score: number, member: string) {
    return this.redisProvider.client.zadd(key, score, member);
  }

  async zrank(key: string, member: string): Promise<number | null> {
    const rank = await this.redisProvider.client.zrank(key, member);
    return rank !== null ? rank : null;
  }

  async zpopmin(key: string) {
    const result = await this.redisProvider.client.zpopmin(key, 1);
    if (result.length === 0) {
      return null;
    }
    return result[0];
  }

  async add(key: string, value: string, ttlms = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    await this.redisProvider.client.set(key, value, 'PX', ttlms);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redisProvider.client.exists(key);
    return result === 1;
  }

  async update(key: string, value: string, ttlms = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    await this.redisProvider.client.set(key, value, 'PX', ttlms);
  }

  async get(key: string): Promise<string | null> {
    return this.redisProvider.client.get(key);
  }
}
