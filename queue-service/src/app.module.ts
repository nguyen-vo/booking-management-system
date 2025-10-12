import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CqrsModule } from '@nestjs/cqrs';
import { RedisConnectionModule } from './core/modules/redis-connection/redis-connection.module';
import { BookingQueueModule } from './routes/booking-queue/booking-queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CqrsModule.forRoot(),
    RedisConnectionModule,
    BookingQueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
