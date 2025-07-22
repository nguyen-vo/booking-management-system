import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ReservationExpiredEvent } from '../events/reservation-expired.event';
import { UpdateBookingRepository } from '../ports/update-booking.repository';

@EventsHandler(ReservationExpiredEvent)
export class ReservationExpiredEventHandler implements IEventHandler<ReservationExpiredEvent> {
  private readonly logger = new Logger(ReservationExpiredEventHandler.name);

  constructor(private readonly updateBookingRepository: UpdateBookingRepository) {}

  async handle(event: ReservationExpiredEvent) {
    const { reservationId, userId } = event;

    this.logger.log(`Handling expired reservation: ${reservationId} for user: ${userId}`);

    try {
      const booking = await this.updateBookingRepository.getBookingById(reservationId);
      if (!booking) {
        this.logger.warn(`Booking not found for reservationId: ${reservationId}`);
        return;
      }

      booking.status = 'Canceled';
      await this.updateBookingRepository.update(booking);

      this.logger.log(`Booking ${reservationId} marked as Canceled`);
    } catch (error) {
      this.logger.error(`Failed to handle expired reservation ${reservationId}:`, error);
      throw error;
    }
  }
}
