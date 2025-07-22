import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateReservationCommand } from './create-reservation.command';
import { TicketRepository } from '../../ports/ticket.repository';
import { CreateReservationRepository } from '../../ports/create-reservation.repository';
import { UnavailableTicketException } from '../../exceptions/unavailable-ticket.exception';
import { Logger } from '@nestjs/common';

@CommandHandler(CreateReservationCommand)
export class CreateReservationCommandHandler implements ICommandHandler<CreateReservationCommand> {
  constructor(
    private readonly ticketRepository: TicketRepository,
    private readonly createReservationRepository: CreateReservationRepository,
  ) {}
  async execute(command: CreateReservationCommand) {
    const { userId, ticketIds } = command;
    Logger.debug(`Creating reservation for user ${userId} with tickets ${ticketIds.join(', ')}`);
    const { areAvailable, unavailableTicketIds } = await this.ticketRepository.areAvailable(ticketIds, userId);
    if (!areAvailable) {
      Logger.warn(`Tickets are not available for user ${userId}: ${unavailableTicketIds?.join(', ')}`);
      throw new UnavailableTicketException(unavailableTicketIds);
    }
    const reservationId = await this.createReservation(userId, ticketIds);
    return { reservationId, userId, ticketIds };
  }

  private async createReservation(userId: string, ticketIds: string[]): Promise<string | null> {
    let reservationId: string | null = null;
    try {
      const areAvailable = await this.ticketRepository.areAvailable(ticketIds, userId);
      if (!areAvailable.areAvailable) {
        Logger.warn(`Tickets are not available for user ${userId}: ${areAvailable.unavailableTicketIds?.join(', ')}`);
        throw new UnavailableTicketException(areAvailable.unavailableTicketIds);
      }
      await this.ticketRepository.lockAll(ticketIds, userId);
      Logger.debug(`Tickets locked for user ${userId}. Creating reservation.`);

      reservationId = await this.createReservationRepository.createReservation(userId, ticketIds);
      Logger.debug(`Reservation created with ID ${reservationId} for user ${userId}`);

      await this.ticketRepository.setReservation(userId, ticketIds, reservationId);
      Logger.debug(`Lock updated with booking ID ${reservationId} for user ${userId}`);
    } catch (e) {
      const error = e as Error;
      await this.ticketRepository.releaseLock(ticketIds);
      Logger.error(`Failed to create reservation for user ${userId}: ${error.message}`);
      throw error;
    }
    Logger.debug(`Reservation created for user ${userId} with ID ${reservationId}`);
    return reservationId;
  }
}
