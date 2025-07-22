import { Ticket } from './ticket.entity';

export class Booking {
  bookingId: string;
  userId: string;
  tickets: Ticket[];
  status: string;
  bookingDate: Date;
  totalAmount: number;
}
