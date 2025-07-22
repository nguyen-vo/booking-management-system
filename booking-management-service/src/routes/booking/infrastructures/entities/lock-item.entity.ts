export class LockItem {
  public type = 'LockItem';
  constructor(
    public userId: string,
    public ticketId: string,
    public lockUntil: Date,
  ) {}
}
