export class DequeueUserCommand {
  constructor(
    public readonly prevUserId: string,
    public readonly eventId: string,
    public readonly idempotencyKey: string,
  ) {}
}
