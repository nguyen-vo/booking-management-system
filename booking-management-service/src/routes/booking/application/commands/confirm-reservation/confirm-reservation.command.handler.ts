import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConfirmReservationCommand } from './confirm-reservation.command';
import { TicketRepository } from '../../ports/ticket.repository';
import { ConfirmReservationRepository } from '../../ports/confirm-reservation.repository';
import { ReservationExpiredException } from '../../exceptions/reservation-expired.exception';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { EventRepository } from '../../ports/event.repository';
import { Reservation } from 'src/routes/booking/domain/reservation.entity';
import { BookedEventPublisher } from '../../ports/booked-event.publisher';

@CommandHandler(ConfirmReservationCommand)
export class ConfirmReservationCommandHandler implements ICommandHandler<ConfirmReservationCommand> {
  constructor(
    private readonly ticketRepository: TicketRepository,
    private readonly confirmReservationRepository: ConfirmReservationRepository,
    private readonly eventRepository: EventRepository,
    private readonly publisher: BookedEventPublisher,
  ) {}
  async execute(command: ConfirmReservationCommand) {
    const { reservationId } = command;
    const reservation = await this.confirmReservationRepository.getReservation(reservationId);
    if (!reservation) {
      await this.handleExpiredReservation(reservationId);
    }
    const { userId, ticketIds } = reservation as Reservation;
    return this.handleConfirmedReservation(userId, reservationId, ticketIds);
  }

  async handleExpiredReservation(reservationId: string) {
    await this.confirmReservationRepository.updateBookingStatus(reservationId, 'Canceled');
    throw new ReservationExpiredException();
  }

  async handleConfirmedReservation(userId: string, reservationId: string, ticketIds: string[]) {
    const oneMinute = 1 * 60 * 1000;
    await this.ticketRepository.increaseLockTime(ticketIds, userId, oneMinute);
    const successful = await this.confirmReservationRepository.confirmReservation(reservationId, ticketIds);
    if (!successful) {
      throw new InternalServerErrorException('Failed to confirm reservation');
    }
    const reservation = await this.confirmReservationRepository.getBookingById(reservationId);

    await this.signalDequeue(ticketIds[0], userId);

    return reservation;
  }

  private async signalDequeue(ticketId: string, userId: string) {
    const event = await this.eventRepository.getEventIdByTicketId(ticketId);
    if (event && event?.isPopular) {
      const eventType = 'reservation-confirmed';
      await this.publisher.publish(userId, event.eventId, eventType);
    } else {
      Logger.warn(
        `Event with id "${event?.eventId}" is ${event?.isPopular ? 'popular' : 'not popular'}, skipping signal dequeue.`,
      );
    }
  }
}
