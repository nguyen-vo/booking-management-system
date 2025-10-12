import { Injectable } from '@nestjs/common';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { EnqueueUserCommand } from './commands/enqueue-user/enqueue-user.command';

@Injectable()
export class BookingQueueService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
  ) {}

  async enqueueUser(enqueueCommand: EnqueueUserCommand): Promise<number> {
    return this.commandBus.execute(enqueueCommand);
  }

  dequeueUser() {}
}
