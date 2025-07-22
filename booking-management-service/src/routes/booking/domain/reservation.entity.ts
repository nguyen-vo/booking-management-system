import { UserId } from 'src/core/interfaces';

export class Reservation {
  public type = 'Reservation';
  constructor(
    public bookingId: string,
    public userId: UserId,
    public ticketIds: string[],
  ) {}
}
