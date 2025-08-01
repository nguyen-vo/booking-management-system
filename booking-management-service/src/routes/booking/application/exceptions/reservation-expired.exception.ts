import { BadRequestException } from '@nestjs/common';

export class ReservationExpiredException extends BadRequestException {
  details: Record<string, any>;
  constructor() {
    super('Reservation has been expired. Cause: Some tickets are no longer available.');
    this.name = 'ReservationExpiredException';
  }
}
