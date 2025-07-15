import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { Location } from './location.entity';
import { Ticket } from './ticket.entity';
import { Performer } from './performer.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  eventId: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'timestamp', nullable: false })
  date: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['Concert', 'Sports', 'Theater', 'Festival'],
    nullable: false,
  })
  type: string;

  @Column({
    type: 'enum',
    enum: ['Upcoming', 'Ongoing', 'Completed'],
    nullable: false,
    default: 'Upcoming',
  })
  status: string;

  @Column({ type: 'uuid', nullable: false })
  locationId: string;

  @ManyToOne(() => Location, (location) => location.events)
  @JoinColumn({ name: 'locationId' })
  location: Location;

  @OneToMany(() => Ticket, (ticket) => ticket.event)
  tickets: Ticket[];

  @ManyToMany(() => Performer, (performer) => performer.events)
  @JoinTable({
    name: 'event_performers',
    joinColumn: { name: 'eventId', referencedColumnName: 'eventId' },
    inverseJoinColumn: {
      name: 'performerId',
      referencedColumnName: 'performerId',
    },
  })
  performers: Performer[];
}
