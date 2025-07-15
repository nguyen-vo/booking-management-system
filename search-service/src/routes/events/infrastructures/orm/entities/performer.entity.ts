import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Event } from './event.entity';

@Entity('performers')
export class Performer {
  @PrimaryGeneratedColumn('uuid')
  performerId: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToMany(() => Event, (event) => event.performers)
  events: Event[];
}
