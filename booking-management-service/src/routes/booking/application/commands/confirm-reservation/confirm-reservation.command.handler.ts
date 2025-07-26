import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConfirmReservationCommand } from './confirm-reservation.command';
import { TicketRepository } from '../../ports/ticket.repository';
import { ConfirmReservationRepository } from '../../ports/confirm-reservation.repository';
import { ReservationExpiredException } from '../../exceptions/reservation-expired.exception';
import { Inject, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { EventRepository } from '../../ports/event.repository';

@CommandHandler(ConfirmReservationCommand)
export class ConfirmReservationCommandHandler implements ICommandHandler<ConfirmReservationCommand> {
  constructor(
    private readonly ticketRepository: TicketRepository,
    private readonly confirmReservationRepository: ConfirmReservationRepository,
    private readonly eventRepository: EventRepository,
    @Inject('BOOKING_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}
  async execute(command: ConfirmReservationCommand) {
    const { reservationId } = command;
    const booking = await this.confirmReservationRepository.getReservation(reservationId);
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${reservationId} not found`);
    }
    const { userId, ticketIds } = booking;
    const { areExpired, expiredTicketIds } = await this.ticketRepository.areExpired(ticketIds, userId);
    if (areExpired) {
      await this.handleExpiredReservation(reservationId, expiredTicketIds);
    } else {
      return this.handleConfirmedReservation(userId, reservationId, ticketIds);
    }
  }

  async handleExpiredReservation(reservationId: string, expiredTicketIds: string[] = []) {
    await this.confirmReservationRepository.updateBookingStatus(reservationId, 'Canceled');
    throw new ReservationExpiredException(expiredTicketIds);
  }

  async handleConfirmedReservation(userId: string, reservationId: string, ticketIds: string[]) {
    const oneMinute = 1 * 60 * 1000;
    await this.ticketRepository.increaseLockTime(ticketIds, userId, oneMinute);
    const successful = await this.confirmReservationRepository.confirmReservation(reservationId, ticketIds);
    if (!successful) {
      throw new InternalServerErrorException('Failed to confirm reservation');
    }
    const reservation = await this.confirmReservationRepository.getBookingById(reservationId);
    await this.signalDequeue(ticketIds[0]);

    return reservation;
  }

  private async signalDequeue(ticketId: string) {
    const event = await this.eventRepository.getEventIdByTicketId(ticketId);
    console.log(event);
    if (event && event?.isPopular) {
      try {
        this.kafkaClient.emit('reservation_confirmed', {
          key: event.eventId,
          value: {
            eventId: event.eventId,
            timestamp: new Date().toISOString(),
          },
        });
        Logger.log(`Published event for eventId: ${event.eventId}`);
      } catch (error) {
        Logger.error(`Kafka publish error for eventId: ${event.eventId}`, error);
      }
    } else {
      Logger.warn(
        `Event with id "${event?.eventId}" is ${event?.isPopular ? 'popular' : 'not popular'}, skipping signal dequeue.`,
      );
    }
  }
}
