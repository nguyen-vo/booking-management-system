export abstract class QueueRepository {
  abstract enqueueUser(userId: string, eventId: string): Promise<number>;

  abstract dequeueUser(eventId: string): Promise<string | null>;
}
