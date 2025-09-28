export class FindTicketsQuery {
  constructor(
    public readonly eventId: string,
    public readonly limit: number,
    public readonly offset: number,
  ) {}
}

export interface FoundTickets {
  eventId: string;
  tickets: Array<string>;
  limit: number;
  offset: number;
}
