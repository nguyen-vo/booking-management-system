import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event, Location, Performer, Ticket } from './entities';
import { FindAllEventRepository } from '../../application/ports/find-all-events.repository';
import { FindAnEventRepository } from '../../application/ports/find-an-event.repository';
import { OrmFindAllEventRepository } from './repositories/orm-find-all-event.repository';
import { OrmFindAnEventRepository } from './repositories/orm-find-an-event.repository';
import { FindTicketsRepository } from '../../application/ports/find-tickets.repository';
import { OrmFindTicketsRepository } from './repositories/orm-find-tickets.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Location, Performer, Ticket])],
  providers: [
    {
      provide: FindAllEventRepository,
      useClass: OrmFindAllEventRepository,
    },
    {
      provide: FindAnEventRepository,
      useClass: OrmFindAnEventRepository,
    },
    {
      provide: FindTicketsRepository,
      useClass: OrmFindTicketsRepository,
    },
  ],
  exports: [FindAllEventRepository, FindAnEventRepository, FindTicketsRepository],
})
export class OrmEventModule {}
