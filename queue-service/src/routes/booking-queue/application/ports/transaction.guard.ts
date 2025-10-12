export abstract class TransactionGuard {
  abstract wasExecuted(idempotencyKey: string): Promise<boolean>;

  abstract markExecuted(idempotencyKey: string): Promise<void>;
}
