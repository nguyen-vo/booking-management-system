import { Module } from '@nestjs/common';
import { RedisProvider } from './redis-connection.provider';

@Module({
  providers: [RedisProvider],
  exports: [RedisProvider],
})
export class RedisConnectionModule {}
