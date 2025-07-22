export class Ticket {
  constructor(
    public ticketId: string,
    public eventId: string,
    public status: string,
    public price: number,
    public seatNumber: string,
    public userId?: string,
  ) {}
}
