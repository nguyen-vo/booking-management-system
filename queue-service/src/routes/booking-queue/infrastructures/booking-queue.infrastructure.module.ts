import { Module } from '@nestjs/common';
import { RedisCacheModule } from 'src/core/modules/redis-cache/redis-cache.module';
import { QueueRepository } from '../application/ports/queue.repository';
import { RedisQueueRepository } from './repository/redis-queue.repository';
import { TransactionGuard } from '../application/ports/transaction.guard';
import { RedisTransactionGuard } from './guard/redis-transaction.guard';

@Module({
  imports: [RedisCacheModule],
  providers: [
    {
      provide: QueueRepository,
      useClass: RedisQueueRepository,
    },
    {
      provide: TransactionGuard,
      useClass: RedisTransactionGuard,
    },
  ],
  exports: [QueueRepository, TransactionGuard],
})
export class BookingQueueInfrastructureModule {}
