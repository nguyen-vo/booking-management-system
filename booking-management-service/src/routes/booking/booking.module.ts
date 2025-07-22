import { Module } from '@nestjs/common';
import { BookingService } from './application/booking.service';
import { BookingController } from './presenter/booking.controller';
import { CreateReservationCommandHandler } from './application/commands/create-reservation/create-reservation.command.handler';
import { ConfirmReservationCommandHandler } from './application/commands/confirm-reservation/confirm-reservation.command.handler';
import { OrmReservationModule } from './infrastructures/reservation.infrastructure.module';
import { ReservationExpiredEventHandler } from './application/events/reservation-expired.event-handler';

@Module({
  imports: [
    RedisSubscriberModule.forFeature({
      pattern: '__keyevent@*__:expired',
      eventType: 'expired',
      eventName: 'reservation.expired',
      keyPrefix: 'booking_management_service:',
    }),
  ],
  controllers: [
    //controller...
  ],
  providers: [
    //provides...
  ],
  exports: [BookingService],
})
export class BookingModule {}
