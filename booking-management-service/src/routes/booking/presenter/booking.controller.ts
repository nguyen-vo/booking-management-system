import { Controller, Post, Body, Patch, Param, UsePipes, ValidationPipe, Logger } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto.request';
import { ConfirmReservationParamDto } from './dto/confirm-reservation.param.dto';
import { BookingService } from '../application/booking.service';
import { CreateReservationCommand } from '../application/commands/create-reservation/create-reservation.command';
import { ConfirmReservationCommand } from '../application/commands/confirm-reservation/confirm-reservation.command';
import { Ctx, EventPattern, Payload, RedisContext, Transport } from '@nestjs/microservices';
import { ReservationExpiredEventDto } from './dto/reservation-expired.dto.event';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateReservationDtoResponse } from './dto/create-reservation.dto.response';

@ApiTags('bookings')
@Controller('bookings')
@UsePipes(new ValidationPipe({ transform: true }))
export class BookingController {
  constructor(private readonly service: BookingService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Reservation created successfully.', type: CreateReservationDtoResponse })
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.service.create(
      new CreateReservationCommand(createReservationDto.userId, createReservationDto.ticketIds),
    );
  }

  @Patch(':reservationId')
  @ApiResponse({ status: 200, description: 'Reservation confirmed successfully.', type: CreateReservationDtoResponse })
  update(@Param() params: ConfirmReservationParamDto) {
    return this.service.update(new ConfirmReservationCommand(params.reservationId));
  }

  @EventPattern({ cmd: '*expired*' }, Transport.REDIS)
  async receivedReservationExpired(@Payload() data: ReservationExpiredEventDto, @Ctx() context: RedisContext) {
    Logger.log(' Received reservation.expired event:', data);
    Logger.log(' Context:', context);
    await this.service.handleExpiredReservation(data.reservationId, data.userId, data.ticketIds);
  }
}
