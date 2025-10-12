export class TransactionStatus {
  private _status: TransactionStatuses = TransactionStatuses.PENDING;
  constructor(public readonly idempotencyKey: string) {}

  static create(idempotencyKey: string) {
    return new TransactionStatus(idempotencyKey);
  }

  markCompleted() {
    this._status = TransactionStatuses.COMPLETED;
  }

  get status(): TransactionStatuses {
    return this._status;
  }

  static isCompleted(status: TransactionStatuses): boolean {
    return status === TransactionStatuses.COMPLETED;
  }
}

export enum TransactionStatuses {
  PENDING = 'pending',
  COMPLETED = 'completed',
}
