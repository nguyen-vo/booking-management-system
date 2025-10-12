import { Module } from '@nestjs/common';
import { RedisCacheModule } from 'src/core/modules/redis-cache/redis-cache.module';
import { QueueRepository } from '../application/ports/queue.repository';
import { RedisQueueRepository } from './repository/redis-queue.repository';

@Module({
  imports: [RedisCacheModule],
  providers: [
    {
      provide: QueueRepository,
      useClass: RedisQueueRepository,
    },
  ],
  exports: [QueueRepository],
})
export class BookingQueueInfrastructureModule {}
