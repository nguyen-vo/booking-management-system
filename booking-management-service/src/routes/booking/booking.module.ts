import { Module } from '@nestjs/common';
import { BookingService } from './application/booking.service';
import { BookingController } from './presenter/booking.controller';
import { CreateReservationCommandHandler } from './application/commands/create-reservation/create-reservation.command.handler';
import { ConfirmReservationCommandHandler } from './application/commands/confirm-reservation/confirm-reservation.command.handler';
import { OrmReservationModule } from './infrastructures/reservation.infrastructure.module';
import { ReservationExpiredEventHandler } from './application/events/reservation-expired.event-handler';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    OrmReservationModule,
    ClientsModule.register([
      {
        name: 'BOOKING_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'booking-management-service',
            brokers: [process.env.KAFKA_BROKER || 'kafka:29092'],
            retry: {
              initialRetryTime: 100,
              retries: 8,
            },
          },
          consumer: {
            groupId: 'booking-consumer-group',
            retry: {
              initialRetryTime: 100,
              retries: 8,
            },
          },
          producer: {
            retry: {
              initialRetryTime: 100,
              retries: 8,
            },
          },
        },
      },
    ]),
  ],
  controllers: [BookingController],
  providers: [
    BookingService,
    CreateReservationCommandHandler,
    ConfirmReservationCommandHandler,
    ReservationExpiredEventHandler,
  ],
  exports: [BookingService],
})
export class BookingModule {}
