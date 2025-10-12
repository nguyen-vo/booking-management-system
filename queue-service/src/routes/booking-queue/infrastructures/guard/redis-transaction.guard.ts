import { RedisCacheService } from 'src/core/modules/redis-cache/redis-cache.service';
import { TransactionGuard } from '../../application/ports/transaction.guard';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RedisTransactionGuard implements TransactionGuard {
  constructor(private readonly redis: RedisCacheService) {}

  wasExecuted(idempotencyKey: string): Promise<boolean> {
    Logger.log(`is redis defined: ${!!this.redis}`);
    return this.redis.exists(idempotencyKey);
  }
  markExecuted(idempotencyKey: string): Promise<void> {
    return this.redis.add(idempotencyKey, 'completed');
  }
}
