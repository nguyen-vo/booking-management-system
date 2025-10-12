import { Injectable } from '@nestjs/common';
import { QueueRepository } from '../../application/ports/queue.repository';
import { RedisCacheService } from 'src/core/modules/redis-cache/redis-cache.service';

@Injectable()
export class RedisQueueRepository implements QueueRepository {
  constructor(private readonly redis: RedisCacheService) {}
  async enqueueUser(userId: string, eventId: string): Promise<number> {
    const queueKey = this._getQueueKey(eventId);
    const score = Date.now();
    await this.redis.zadd(queueKey, score, userId);
    const rank = await this.redis.zrank(queueKey, userId);
    return rank !== null ? rank + 1 : 0;
  }

  private _getQueueKey(eventId: string): string {
    return `event-queue:${eventId}`;
  }

  async dequeueUser(eventId: string): Promise<string | null> {
    const queueKey = this._getQueueKey(eventId);
    const nextUser = await this.redis.zpopmin(queueKey);
    return nextUser ? nextUser : null;
  }
}
