export class EnqueueUserCommand {
  constructor(
    public readonly userId: string,
    public readonly eventId: string,
  ) {}
}
