import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConfirmReservationCommand } from './confirm-reservation.command';
import { TicketRepository } from '../../ports/ticket.repository';
import { ConfirmReservationRepository } from '../../ports/confirm-reservation.repository';
import { ReservationExpiredException } from '../../exceptions/reservation-expired.exception';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';

@CommandHandler(ConfirmReservationCommand)
export class ConfirmReservationCommandHandler implements ICommandHandler<ConfirmReservationCommand> {
  constructor(
    private readonly ticketRepository: TicketRepository,
    private readonly confirmReservationRepository: ConfirmReservationRepository,
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
    const fiveMinutes = 5 * 60 * 1000;
    await this.ticketRepository.increaseLockTime(ticketIds, userId, fiveMinutes);
    const successful = await this.confirmReservationRepository.confirmReservation(reservationId, ticketIds);
    if (!successful) {
      throw new InternalServerErrorException('Failed to confirm reservation');
    }
    const reservation = await this.confirmReservationRepository.getBookingById(reservationId);
    return reservation;
  }
}
