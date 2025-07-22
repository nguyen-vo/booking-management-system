export class CreateReservationCommand {
  constructor(
    public readonly userId: string,
    public readonly ticketIds: string[],
  ) {}
}
