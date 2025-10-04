import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { Booking } from './entities/booking.entity';
import { User } from './entities/user.entity';
import { Event } from './entities/event.entity';
import { CompositeTicketRepository } from './repositories/ticket.repository';
import { OrmCreateReservationRepository } from './repositories/create-reservation.repository';
import { OrmConfirmReservationRepository } from './repositories/confirm-reservation.repository';
import { TicketRepository } from '../application/ports/ticket.repository';
import { CreateReservationRepository } from '../application/ports/create-reservation.repository';
import { ConfirmReservationRepository } from '../application/ports/confirm-reservation.repository';
import { UpdateBookingRepository } from '../application/ports/update-booking.repository';
import { OrmUpdateReservationRepository } from './repositories/update-reservation.repository';
import { EventRepository } from '../application/ports/event.repository';
import { OrmEventRepository } from './repositories/event.repository';
import { PubSubModule } from 'src/core/pubsub/pubsub.module';
import { BookedEventPublisher } from '../application/ports/booked-event.publisher';
import { PubSubBookingEventPublisher } from './publishers/pubsub-booking-event.publisher';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Booking, User, Event]), PubSubModule],
  providers: [
    { provide: TicketRepository, useClass: CompositeTicketRepository },
    { provide: CreateReservationRepository, useClass: OrmCreateReservationRepository },
    { provide: ConfirmReservationRepository, useClass: OrmConfirmReservationRepository },
    { provide: UpdateBookingRepository, useClass: OrmUpdateReservationRepository },
    { provide: EventRepository, useClass: OrmEventRepository },
    { provide: BookedEventPublisher, useClass: PubSubBookingEventPublisher },
  ],
  exports: [
    TicketRepository,
    CreateReservationRepository,
    ConfirmReservationRepository,
    UpdateBookingRepository,
    EventRepository,
    BookedEventPublisher,
  ],
})
export class OrmReservationModule {}
