export abstract class CreateReservationRepository {
  abstract createReservation(userId: string, ticketIds: string[]): Promise<string>;
}
