import { createKeyv } from '@keyv/redis';
import { Logger } from '@nestjs/common';

export async function getRedisStore() {
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = process.env.REDIS_PORT || '6379';
  const redisUrl = `redis://${redisHost}:${redisPort}`;
  const keyv = createKeyv({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries, cause) => {
        Logger.error(`Redis reconnect error: ${cause.message}`);
        return Math.min(retries * 50, 2000);
      },
      timeout: 5000,
      connectTimeout: 5000,
    },
  });

  // Test the connection
  await keyv.set('test-connection', 'test-value', 1000);
  const testResult = (await keyv.get('test-connection')) as string;
  if (testResult === 'test-value') {
    Logger.debug('Redis connection test successful');
    await keyv.delete('test-connection');
  } else {
    Logger.error('Redis connection test failed - value mismatch');
  }

  return {
    namespace: 'booking_management_service',
    store: keyv,
  };
}
