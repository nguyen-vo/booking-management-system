export class DequeueUserEvent {
  constructor(
    public readonly prevUserId: string,
    public readonly eventId: string,
  ) {}
}
