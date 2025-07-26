import { Entity, PrimaryGeneratedColumn, OneToMany, Column } from 'typeorm';
import { Ticket } from './ticket.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  eventId: string;

  @Column({ type: 'boolean', default: false })
  isPopular?: boolean;

  @OneToMany(() => Ticket, (ticket) => ticket.event)
  tickets: Ticket[];
}
