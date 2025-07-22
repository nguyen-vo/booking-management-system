import { BadRequestException } from '@nestjs/common';

export class UnavailableTicketException extends BadRequestException {
  details: Record<string, any>;

  constructor(ticketIds: string[] = []) {
    super(`The following tickets are unavailable: ${ticketIds.join(', ')}`);
    this.details = { unavailableTickets: ticketIds };
    this.name = 'UnavailableTicketException';
  }
}
