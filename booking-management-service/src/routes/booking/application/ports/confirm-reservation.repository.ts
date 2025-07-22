import { Booking } from '../../domain/booking.entity';
import { Reservation } from '../../domain/reservation.entity';

export abstract class ConfirmReservationRepository {
  abstract confirmReservation(bookingId: string, ticketIds: string[]): Promise<boolean>;
  abstract updateBookingStatus(bookingId: string, status: string): Promise<void>;
  abstract getReservation(bookingId: string): Promise<Reservation | null>;
  abstract getBookingById(bookingId: string): Promise<Booking | null>;
}
