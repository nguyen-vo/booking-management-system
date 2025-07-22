export abstract class TicketRepository {
  abstract lockAll(ticketIds: string[], userId: string): Promise<void>;

  abstract areAvailable(
    ticketIds: string[],
    userId: string,
  ): Promise<{ areAvailable: boolean; unavailableTicketIds: string[] | undefined }>;

  abstract areExpired(
    ticketIds: string[],
    userId: string,
  ): Promise<{ areExpired: boolean; expiredTicketIds: string[] | undefined }>;

  abstract increaseLockTime(ticketIds: string[], userId: string, ttl: number): Promise<void>;

  abstract releaseLock(ticketIds: string[]): Promise<void>;

  abstract setReservation(userId: string, ticketIds: string[], bookingId: string): Promise<void>;
}
