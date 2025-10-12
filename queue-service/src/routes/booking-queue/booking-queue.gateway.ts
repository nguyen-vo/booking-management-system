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
import { SubscriptionToken } from './constants';
import { SubscriberProvider } from 'src/core/modules/pubsub-subscription/subscriber.provider';
import { Message } from '@google-cloud/pubsub';
import { EnqueueMessageBody } from './dto/enqueue-message.dto';

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

  @SubscribeMessage('join-queue')
  async onJoinQueueEvent(@MessageBody() data: JoinQueueDto, @ConnectedSocket() client: Socket) {
    return this.bookingQueueService.enqueueUser(new EnqueueUserCommand(data.userId, data.eventId), client);
  }

  onModuleInit() {
    this.bookingQueueService.namespace = this.namespace;
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.subscriber.subscription.on('message', (message: Message) => this.bookingQueueService.handleMessage(message));

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
}
