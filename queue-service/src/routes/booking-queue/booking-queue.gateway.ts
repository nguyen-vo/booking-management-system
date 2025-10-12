/* eslint-disable @typescript-eslint/no-unused-vars */
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  WsResponse,
  WsException,
  OnGatewayConnection,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { JoinQueueDto } from './dto/join-queue.dto';
import { BookingQueueService } from './application/booking-queue.service';
import { EnqueueUserCommand } from './application/commands/enqueue-user/enqueue-user.command';
import { ofType, Saga } from '@nestjs/cqrs';
import { map, Observable } from 'rxjs';
import { DequeueUserEvent } from './application/events/dequeue-user.event';
import { SubscriptionToken } from './constants';
import { SubscriberProvider } from 'src/core/modules/pubsub-subscription/subscriber.provider';
import { Message } from '@google-cloud/pubsub';

@Injectable()
@WebSocketGateway({ namespace: '/booking-queue', transports: ['websocket'] })
@UsePipes(
  new ValidationPipe({ whitelist: true, transform: true, exceptionFactory: (errors) => new WsException(errors) }),
)
export class BookingQueueGateway implements OnGatewayDisconnect, OnGatewayConnection, OnModuleDestroy, OnModuleInit {
  @WebSocketServer()
  private namespace: Namespace;

  private readonly logger = new Logger(BookingQueueGateway.name);

  constructor(
    private readonly bookingQueueService: BookingQueueService,
    @Inject(SubscriptionToken) private readonly subscriber: SubscriberProvider,
  ) {}

  onModuleInit() {
    this.subscriber.subscription.on('message', (message) => this._handleMessage(message));
    this.logger.log(
      `BookingQueueSubscriber initialized and listening for messages on ${this.subscriber.subscription.name}`,
    );
  }

  onModuleDestroy() {
    if (this.subscriber.subscription) {
      this.subscriber.subscription.removeAllListeners('message');
      this.subscriber.subscription
        .close()
        .then(() => {
          this.logger.log('Subscription closed successfully.');
        })
        .catch((error) => {
          this.logger.error('Error closing subscription:', error);
        });
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}, data: ${JSON.stringify(client.data)}`);
  }
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('join-queue')
  async onJoinQueueEvent(@MessageBody() data: JoinQueueDto, @ConnectedSocket() client: Socket) {
    let position: number;
    try {
      await client.join(data.userId);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      client.data.userId = data.userId;
      position = await this.bookingQueueService.enqueueUser(new EnqueueUserCommand(data.userId, data.eventId));
      const body = { message: `You are in position ${position} in the queue.`, position, ...data };
      this.logger.debug(`User ${data.userId} joined the queue for event ${data.eventId} at position ${position}`);
      return { event: 'joined-queue', data: body };
    } catch (error) {
      this.logger.error('Error enqueuing user:', error);
      return { event: 'error', data: { message: 'Failed to join the queue.' } };
    }
  }

  private _handleMessage(message: Message) {
    // Process the incoming message
    this.logger.log('Received message:', message.data.toString());
    message.ack();
  }

  @Saga()
  removeUserFromQueue(events$: Observable<any>): Observable<any> {
    return events$.pipe(
      ofType(DequeueUserEvent),
      map((event) => {
        this.namespace.in(event.prevUserId).disconnectSockets(true);
        this.logger.debug(`Closed sockets for the previous user in the queue ${event.prevUserId}`);
      }),
    );
  }
}
