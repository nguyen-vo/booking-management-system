export class ReservationEvent {
  constructor(
    public readonly eventId: string,
    public readonly prevUserId: string,
    public readonly eventType: string,
  ) {}

  public static create(data: string, eventType: string): ReservationEvent {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsed = JSON.parse(Buffer.from(data).toString('utf-8'));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return new ReservationEvent(parsed.eventId, parsed.userId, eventType);
  }
}
