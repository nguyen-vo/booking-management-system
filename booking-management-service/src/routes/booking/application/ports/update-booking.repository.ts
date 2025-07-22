import { Booking } from '../../domain/booking.entity';

export abstract class UpdateBookingRepository {
  abstract getBookingById(bookingId: string): Promise<Booking | null>;
  abstract update(booking: Booking): Promise<void>;
}
