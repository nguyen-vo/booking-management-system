import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsModule } from './routes/events/events.module';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from './core/database/database.module';
import { getRedisStore } from './core/modules/redis-cache.setting';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule.forRoot(),
    CqrsModule.forRoot(),
    EventsModule,
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
