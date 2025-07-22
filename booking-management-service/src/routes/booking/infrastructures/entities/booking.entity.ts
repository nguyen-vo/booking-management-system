import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Ticket } from './ticket.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  bookingId: string;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @CreateDateColumn()
  bookingDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: ['Pending', 'Confirmed', 'Canceled'],
    default: 'Pending',
    nullable: false,
  })
  status: string;

  @ManyToOne(() => User, (user) => user.bookings)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Ticket, (ticket) => ticket.booking)
  tickets: Ticket[];
}
