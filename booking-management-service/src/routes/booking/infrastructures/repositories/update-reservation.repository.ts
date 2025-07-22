import { Injectable } from '@nestjs/common';
import { UpdateBookingRepository as UpdateReservationRepository } from '../../application/ports/update-booking.repository';
import { Booking } from '../../domain/booking.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class OrmUpdateReservationRepository implements UpdateReservationRepository {
  constructor(@InjectRepository(Booking) private bookingRepository: Repository<Booking>) {}

  getBookingById(bookingId: string): Promise<Booking | null> {
    return this.bookingRepository.findOne({ where: { bookingId } });
  }
  async update(booking: Booking): Promise<void> {
    await this.bookingRepository.save(booking);
  }
}
