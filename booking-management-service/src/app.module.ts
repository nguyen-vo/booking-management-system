import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from './core/database/database.module';
import { BookingModule } from './routes/booking/booking.module';
import { CacheModule } from '@nestjs/cache-manager';
import { getRedisStore } from './core/modules/redis-cache.seting';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule.forRoot(),
    CqrsModule.forRoot(),
    BookingModule,
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const { namespace, store } = await getRedisStore();
        return {
          namespace,
          stores: [store],
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
