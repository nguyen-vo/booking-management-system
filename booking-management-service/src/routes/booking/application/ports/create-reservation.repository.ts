export abstract class CreateReservationRepository {
  abstract createReservation(userId: string, ticketIds: string[]): Promise<string>;

  abstract hasExistingReservation(
    userId: string,
    ticketIds: string[],
  ): Promise<{ exists: boolean; bookingId?: string }>;
}
