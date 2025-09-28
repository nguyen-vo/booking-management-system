export abstract class FindTicketsRepository {
  abstract findTickets(eventId: string, limit: number, offset: number): Promise<Array<string>>;
}
