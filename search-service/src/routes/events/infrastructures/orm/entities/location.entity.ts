import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Event } from './event.entity';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  locationId: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: false })
  address: string;

  @Column({ type: 'int', nullable: false })
  seatCapacity: number;

  @OneToMany(() => Event, (event) => event.location)
  events: Event[];
}
