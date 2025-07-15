import { Module } from '@nestjs/common';
import { EventsController } from './presenter/events.controller';
import { EventsService } from './application/events.service';
import { FindAllEventQueryHandler } from './application/queries/find-all-events/find-all-events.query-handler';
import { EventInfrastructureModule } from './infrastructures/event.infrastructure.module';
import { FindAnEventQueryHandler } from './application/queries/find-an-event/find-an-event.query-handler';

@Module({
  imports: [EventInfrastructureModule],
  controllers: [EventsController],
  providers: [EventsService, FindAllEventQueryHandler, FindAnEventQueryHandler],
  exports: [EventsService],
})
export class EventsModule {}
