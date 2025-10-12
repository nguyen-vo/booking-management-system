import { Module } from '@nestjs/common';
import { RedisIoAdapter } from '../../../adapter/redis-adapter';

@Module({
  providers: [RedisIoAdapter],
  exports: [RedisIoAdapter],
})
export class RedisAdapterModule {}
