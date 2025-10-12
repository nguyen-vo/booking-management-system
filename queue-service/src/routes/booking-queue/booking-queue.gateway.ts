/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
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

@Injectable()
@WebSocketGateway({ namespace: '/booking-queue', transports: ['websocket'] })
@UsePipes(
  new ValidationPipe({ whitelist: true, transform: true, exceptionFactory: (errors) => new WsException(errors) }),
)
export class BookingQueueGateway implements OnGatewayDisconnect, OnGatewayConnection {
  @WebSocketServer()
  private namespace: Namespace;
  constructor(private readonly bookingQueueService: BookingQueueService) {}

  handleDisconnect(client: Socket) {
    Logger.log(`Client disconnected: ${client.id}, data: ${JSON.stringify(client.data)}`);
  }
  handleConnection(client: Socket) {
    Logger.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('join-queue')
  async onJoinQueueEvent(@MessageBody() data: JoinQueueDto, @ConnectedSocket() client: Socket) {
    let position: number;
    try {
      client.join(data.userId);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      client.data.userId = data.userId;
      position = await this.bookingQueueService.enqueueUser(new EnqueueUserCommand(data.userId, data.eventId));
      const body = { message: `You are in position ${position} in the queue.`, position, ...data };
      Logger.debug(`User ${data.userId} joined the queue for event ${data.eventId} at position ${position}`);
      return { event: 'joined-queue', data: body };
    } catch (error) {
      Logger.error('Error enqueuing user:', error);
      return { event: 'error', data: { message: 'Failed to join the queue.' } };
    }
  }

  @Saga()
  removeUserFromQueue(events$: Observable<any>): Observable<any> {
    return events$.pipe(
      ofType(DequeueUserEvent),
      map((event) => {
        this.namespace.in(event.prevUserId).disconnectSockets(true);
        Logger.debug(`Closed sockets for the previous user in the queue ${event.prevUserId}`);
      }),
    );
  }
}
