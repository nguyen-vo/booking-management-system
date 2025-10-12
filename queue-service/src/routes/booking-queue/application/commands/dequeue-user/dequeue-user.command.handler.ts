import { CommandHandler } from '@nestjs/cqrs';
import { QueueRepository } from '../../ports/queue.repository';
import { DequeueUserCommand } from './dequeue-user.command';
import { Logger } from '@nestjs/common';
import { TransactionStatus } from 'src/routes/booking-queue/domains/transaction-status';
import { TransactionGuard } from '../../ports/transaction.guard';

@CommandHandler(DequeueUserCommand)
export class DequeueUserCommandHandler {
  private readonly logger = new Logger(DequeueUserCommandHandler.name);

  constructor(
    private readonly queue: QueueRepository,
    private readonly transactionGuard: TransactionGuard,
  ) {}

  async execute(event: DequeueUserCommand) {
    const { eventId, idempotencyKey, prevUserId } = event;
    try {
      const wasExecuted = await this.transactionGuard.wasExecuted(idempotencyKey);
      if (wasExecuted) {
        this.logger.log(`User with id ${prevUserId} has already been dequeued.`);
        const transaction = TransactionStatus.create(idempotencyKey);
        transaction.markCompleted();
        return transaction.status;
      }
      this.logger.log(`Handling DequeueUserCommand for event: ${eventId}`);
      const nextUser = await this.queue.dequeueUser(eventId);
      this.logger.log(`DequeueUserCommand executed for event: ${eventId}, next user: ${nextUser}`);
      if (nextUser) {
        this.logger.log(`Next user dequeued: ${nextUser} for event ${eventId}`);
      } else {
        this.logger.log(`No user in queue for event ${eventId}`);
      }
      await this.transactionGuard.markExecuted(idempotencyKey);
      return nextUser;
    } catch (e) {
      const error = e as Error;
      this.logger.error(`Error executing DequeueUserCommand for event ${eventId}: ${error.message}`, error);
      throw error;
    }
  }
}
