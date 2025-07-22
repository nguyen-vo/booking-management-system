import { ConfirmReservationRepository } from '../../application/ports/confirm-reservation.repository';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { Ticket } from '../entities/ticket.entity';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Reservation } from '../../domain/reservation.entity';

@Injectable()
export class OrmConfirmReservationRepository implements ConfirmReservationRepository {
  constructor(
    private dataSource: DataSource,
    @Inject(CACHE_MANAGER) private cacheStore: Cache,
    @InjectRepository(Booking) private bookingRepository: Repository<Booking>,
    @InjectRepository(Ticket) private ticketRepository: Repository<Ticket>,
  ) {}

  async confirmReservation(bookingId: string, ticketIds: string[]): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const ticketUpdateResult = await queryRunner.manager
        .createQueryBuilder()
        .setLock('pessimistic_write')
        .update(Ticket)
        .set({ status: 'Sold', bookingId: bookingId })
        .where('ticketId IN (:...ticketIds)', { ticketIds })
        .andWhere('status != :currentStatus', { currentStatus: 'Sold' })
        .execute();

      if (ticketUpdateResult.affected !== ticketIds.length) {
        Logger.error(
          `Failed to update all tickets. Expected: ${ticketIds.length}, Updated: ${ticketUpdateResult.affected}`,
        );
        console.log(ticketUpdateResult);
        throw new Error('Failed to update all tickets');
      }

      // Update booking status
      const bookingUpdateResult = await queryRunner.manager
        .createQueryBuilder()
        .setLock('pessimistic_write')
        .update(Booking)
        .set({ status: 'Confirmed' })
        .where('bookingId = :bookingId', { bookingId })
        .andWhere('status = :currentStatus', { currentStatus: 'Pending' })
        .execute();
      if (bookingUpdateResult.affected !== 1) {
        Logger.error(`Failed to update booking. Expected: 1, Updated: ${bookingUpdateResult.affected}`);
        throw new Error('Failed to update booking');
      }

      await queryRunner.commitTransaction();
      Logger.log(`Successfully confirmed reservation for booking ${bookingId} with ${ticketIds.length} tickets`);
      return true;
    } catch (e) {
      const error = e as Error;
      Logger.error(`Error confirming reservation for booking ${bookingId}: ${error.message}`, error.stack);
      await this.rollbackTransaction(queryRunner, bookingId);
      return false;
    } finally {
      await this.releaseQueryRunner(queryRunner);
    }
  }
  async updateBookingStatus(bookingId: string, status: string): Promise<void> {
    await this.bookingRepository.update({ bookingId }, { status });
  }

  async getBookingById(bookingId: string): Promise<Booking | null> {
    return this.bookingRepository.findOne({ where: { bookingId } });
  }

  private async rollbackTransaction(queryRunner: QueryRunner, bookingId: string): Promise<void> {
    try {
      await queryRunner.rollbackTransaction();
      Logger.debug(`Transaction rolled back for booking ${bookingId}`);
    } catch (rollbackError) {
      Logger.error(`Error rolling back transaction: ${(rollbackError as Error).message}`);
    }
  }

  private async releaseQueryRunner(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.release();
      Logger.debug(`Query runner released successfully`);
    } catch (releaseError) {
      Logger.error(`Error releasing query runner: ${(releaseError as Error).message}`);
    }
  }

  async getReservation(bookingId: string): Promise<Reservation | null> {
    const reservation = await this.cacheStore.get<Reservation>(bookingId);
    if (!reservation) {
      return null;
    }
    return reservation;
  }
}
