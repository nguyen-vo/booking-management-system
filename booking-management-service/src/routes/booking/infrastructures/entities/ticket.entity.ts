import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Booking } from './booking.entity';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  ticketId: string;

  @Column({ type: 'uuid', nullable: false })
  eventId: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  seatNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  price: number;

  @Column({
    type: 'enum',
    enum: ['Available', 'Reserved', 'Sold'],
    default: 'Available',
  })
  status: string;

  @ManyToOne(() => Booking, (booking) => booking.tickets)
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column({ type: 'uuid', nullable: true })
  bookingId?: string;
}
