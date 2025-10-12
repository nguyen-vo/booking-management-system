import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EnqueueUserCommand } from './enqueue-user.command';
import { QueueRepository } from '../../ports/queue.repository';

@CommandHandler(EnqueueUserCommand)
export class EnqueueUserCommandHandler implements ICommandHandler<EnqueueUserCommand> {
  constructor(private readonly queue: QueueRepository) {}

  async execute(command: EnqueueUserCommand) {
    const { userId, eventId } = command;
    return this.queue.enqueueUser(userId, eventId);
  }
}
