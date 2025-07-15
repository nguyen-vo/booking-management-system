// import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
// import { Booking } from './booking.entity';

// @Entity('users')
// export class User {
//   @PrimaryGeneratedColumn('uuid')
//   userId: string;

//   @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
//   username: string;

//   @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
//   email: string;

//   @OneToMany(() => Booking, (booking) => booking.user)
//   bookings: Booking[];
// }
