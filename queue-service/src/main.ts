import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './adapter/redis-adapter';
import { RedisProvider } from './core/modules/redis-connection/redis-connection.provider';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const redisProvider = app.get(RedisProvider);
  const redisAdapter = new RedisIoAdapter(app);
  await redisAdapter.connectToRedis(redisProvider.client);

  app.useWebSocketAdapter(redisAdapter);

  app.enableCors({
    origin: '*',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // app.setGlobalPrefix('ws');

  const port = process.env.PORT || 3000;
  const address = process.env.BIND_ADDRESS || '0.0.0.0';
  await app.listen(port, address);
  console.log(`Application is running on: http://${address}:${port}`);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
