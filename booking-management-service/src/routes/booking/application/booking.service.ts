import { Injectable } from '@nestjs/common';
import { CreateReservationCommand } from './commands/create-reservation/create-reservation.command';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { ConfirmReservationCommand } from './commands/confirm-reservation/confirm-reservation.command';
import { CreateReservationDtoResponse } from '../presenter/dto/create-reservation.dto.response';
import { ReservationExpiredEvent } from './events/reservation-expired.event';

@Injectable()
export class BookingService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
  ) {}

  create(createReservationCommand: CreateReservationCommand): Promise<CreateReservationDtoResponse> {
    return this.commandBus.execute(createReservationCommand);
  }

  update(confirmReservationCommand: ConfirmReservationCommand) {
    return this.commandBus.execute(confirmReservationCommand);
  }

  async handleExpiredReservation(reservationId: string, userId: string, ticketIds: string[]) {
    await this.eventBus.publish(new ReservationExpiredEvent(reservationId, userId, ticketIds));
  }
}
