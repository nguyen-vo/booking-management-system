import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { EnqueueUserCommand } from './commands/enqueue-user/enqueue-user.command';
import { DequeueUserCommand } from './commands/dequeue-user/dequeue-user.command';
import { Message } from '@google-cloud/pubsub';
import { ReservationEvent } from '../domains/reservation-confirmed.event';
import { Namespace, Socket } from 'socket.io';
import { TransactionStatuses } from '../domains/transaction-status';

@Injectable()
export class BookingQueueService {
  private readonly logger = new Logger(BookingQueueService.name);

  private _namespace: Namespace;

  constructor(
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
  ) {}

  set namespace(value: Namespace) {
    this._namespace = value;
  }

  async enqueueUser(
    enqueueCommand: EnqueueUserCommand,
    client: Socket,
  ): Promise<{ event: string; data: Record<string, unknown> }> {
    try {
      await client.join(enqueueCommand.userId);
      await client.join(enqueueCommand.eventId);
      const position = await this.commandBus.execute<EnqueueUserCommand, number>(enqueueCommand);
      const body = {
        message: `You are in position ${position} in the queue.`,
        position,
        eventId: enqueueCommand.eventId,
        userId: enqueueCommand.userId,
      };
      if (body.position === 1) {
        return { event: 'proceed-to-booking', data: body };
      } else {
        return { event: 'joined-queue', data: body };
      }
    } catch (error) {
      this.logger.error('Error enqueuing user:', error);
      return { event: 'error', data: { message: 'Failed to join the queue.' } };
    }
  }

  async handleMessage(message: Message): Promise<void> {
    const attributes = message.attributes || {};
    const eventType = attributes.eventType;
    const eventId = attributes.eventId;
    let userToDisconnect: string | null = null;
    try {
      if (eventType === 'reservation-confirmed' || eventType === 'reservation-expired') {
        const { dequeuedUser, nextUser } = await this._handleDequeueUser(eventType, message.data);
        message.ack();
        userToDisconnect = dequeuedUser;
        this._disconnectClient(userToDisconnect);
        this._updateQueuePositions(eventId, nextUser);
      }
    } catch (e) {
      const error = e as Error;
      this.logger.error(`Error processing message for eventType ${eventType}: ${error.message}`);
      message.nack();
    }
  }

  private async _handleDequeueUser(
    eventType: string,
    data: Buffer<ArrayBufferLike>,
  ): Promise<{
    dequeuedUser: string | null;
    nextUser: string | null;
  }> {
    const reservationEvent = ReservationEvent.create(data.toString('utf-8'), eventType);

    this.logger.log(`Received a message for eventType ${eventType}. Event id is ${reservationEvent.eventId}`);
    const dequeueCommand = new DequeueUserCommand(
      reservationEvent.prevUserId,
      reservationEvent.eventId,
      reservationEvent.prevUserId,
    );
    const { dequeuedUser, nextUser } = await this.commandBus.execute<
      DequeueUserCommand,
      { dequeuedUser: string | null; nextUser: string | null }
    >(dequeueCommand);

    if (dequeuedUser === TransactionStatuses.COMPLETED) {
      return { dequeuedUser: null, nextUser };
    }

    if (dequeuedUser === null) {
      this.logger.debug(
        `No user was dequeued for eventId ${reservationEvent.eventId}. Previous user was ${reservationEvent.prevUserId}`,
      );
      return { dequeuedUser: null, nextUser: null };
    }
    this.logger.debug(
      `Processed message for eventType ${eventType} for eventId ${reservationEvent.eventId}. The dequeued user is ${dequeuedUser}. Previous user was ${reservationEvent.prevUserId}`,
    );
    return { dequeuedUser: reservationEvent.prevUserId, nextUser };
  }

  private _disconnectClient(userId: string | null) {
    if (!userId) {
      return;
    }
    this._namespace.in(userId).disconnectSockets(true);
    this.logger.debug(`Closed sockets for user ${userId}`);
  }

  private _updateQueuePositions(eventId: string, nextUser: string | null) {
    this._namespace.in(eventId).emit('update-user-position', {
      message: `You are being moved up in the queue.`,
      movedBy: 1,
    });
    if (nextUser) {
      this._namespace.in(nextUser).emit('proceed-to-booking', {
        message: `You are in position 1 in the queue.`,
        position: 1,
        eventId: eventId,
        userId: nextUser,
      });
    }
  }
}
