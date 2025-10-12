import { Module } from '@nestjs/common';
import { RedisConnectionModule } from '../redis-connection/redis-connection.module';
import { RedisCacheService } from './redis-cache.service';

@Module({
  imports: [RedisConnectionModule],
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class RedisCacheModule {}
