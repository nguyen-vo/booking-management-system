import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { Booking } from './entities/booking.entity';
import { User } from './entities/user.entity';
import { CompositeTicketRepository } from './repositories/ticket.repository';
import { OrmCreateReservationRepository } from './repositories/create-reservation.repository';
import { OrmConfirmReservationRepository } from './repositories/confirm-reservation.repository';
import { TicketRepository } from '../application/ports/ticket.repository';
import { CreateReservationRepository } from '../application/ports/create-reservation.repository';
import { ConfirmReservationRepository } from '../application/ports/confirm-reservation.repository';
import { UpdateBookingRepository } from '../application/ports/update-booking.repository';
import { OrmUpdateReservationRepository } from './repositories/update-reservation.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Booking, User])],
  providers: [
    { provide: TicketRepository, useClass: CompositeTicketRepository },
    { provide: CreateReservationRepository, useClass: OrmCreateReservationRepository },
    { provide: ConfirmReservationRepository, useClass: OrmConfirmReservationRepository },
    { provide: UpdateBookingRepository, useClass: OrmUpdateReservationRepository },
  ],
  exports: [TicketRepository, CreateReservationRepository, ConfirmReservationRepository, UpdateBookingRepository],
})
export class OrmReservationModule {}
