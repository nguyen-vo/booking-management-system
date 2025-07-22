import { UserId } from 'src/core/interfaces';
import { CreateReservationRepository } from '../../application/ports/create-reservation.repository';
import { In, Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { Ticket } from '../entities/ticket.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class OrmCreateReservationRepository implements CreateReservationRepository {
  constructor(
    @InjectRepository(Booking) private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Ticket) private readonly ticketRepository: Repository<Ticket>,
  ) {}
  async createReservation(userId: UserId, ticketIds: string[]): Promise<string> {
    const booking = this.bookingRepository.create();
    booking.userId = userId;
    Logger.debug(
      `Fetching tickets for reservation creation for user ${userId} with ticket IDs ${ticketIds.join(', ')}`,
    );
    const tickets = await this.ticketRepository.find({
      where: { ticketId: In(ticketIds), status: 'Available' }, //Avoid charging the same ticket multiple times for the same user
      select: ['ticketId', 'price'],
    });
    Logger.debug(`Found tickets for reservation: ${tickets.map((ticket) => ticket.ticketId).join(', ')}`);
    const amount = tickets.reduce((total, ticket) => total + Number(ticket.price), 0);
    Logger.debug(`Total amount for reservation: ${amount}`);
    booking.status = 'Pending';
    booking.bookingDate = new Date();
    booking.userId = userId;
    booking.totalAmount = amount;
    const createdBooking = await this.bookingRepository.save(booking);
    return createdBooking.bookingId;
  }
}
