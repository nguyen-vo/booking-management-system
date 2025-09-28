import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindTicketsRepository } from 'src/routes/events/application/ports/find-tickets.repository';
import { Repository } from 'typeorm';
import { Ticket } from '../entities';

@Injectable()
export class OrmFindTicketsRepository implements FindTicketsRepository {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async findTickets(eventId: string, limit: number, offset: number): Promise<Array<string>> {
    const tickets = await this.ticketRepository.find({
      where: { eventId, status: 'Available' },
      take: limit,
      skip: offset,
      select: ['ticketId'],
    });
    const ticketIds: Array<string> = [];
    if (tickets.length === 0) {
      return ticketIds;
    }
    for (const ticket of tickets) {
      ticketIds.push(ticket.ticketId);
    }
    return ticketIds;
  }
}
