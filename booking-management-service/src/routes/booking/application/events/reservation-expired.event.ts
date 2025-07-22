export class ReservationExpiredEvent {
  public type = 'Reservation';
  constructor(
    public readonly reservationId: string,
    public readonly userId: string,
    public readonly ticketIds: string[],
  ) {}
}
