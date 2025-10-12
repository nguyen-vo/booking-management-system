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
    return result[0][0];
  }
}
