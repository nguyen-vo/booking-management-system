import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TicketRepository } from '../../application/ports/ticket.repository';
import { Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserId } from 'src/core/interfaces';
import { LockItem } from '../entities/lock-item.entity';
import { Reservation } from '../../domain/reservation.entity';

@Injectable()
export class CompositeTicketRepository implements TicketRepository {
  private static readonly ttl = 60 * 1000; //10 *
  constructor(
    @Inject(CACHE_MANAGER) private cacheStore: Cache,
    @InjectRepository(Ticket) private ticketRepository: Repository<Ticket>,
  ) {}

  async areExpired(
    ticketIds: string[],
    userId: UserId,
  ): Promise<{ areExpired: boolean; expiredTicketIds: string[] | undefined }> {
    Logger.debug(`Checking expiration for tickets: ${ticketIds.join(', ')} for user: ${userId}`);
    const lockItems = await this.cacheStore.mget<LockItem>(ticketIds);
    Logger.debug('Lock items fetched:', lockItems);
    const expiredTicket = lockItems.filter((item) => item === undefined);
    const unexpiredTicketIds = lockItems.filter((item) => item !== undefined).map((item) => item.ticketId);
    const expiredTicketIds = ticketIds.filter((id) => !unexpiredTicketIds.includes(id));
    return {
      areExpired: expiredTicket.length > 0,
      expiredTicketIds: expiredTicketIds.length > 0 ? expiredTicketIds : undefined,
    };
  }

  async lockAll(ticketIds: string[], userId: UserId): Promise<void> {
    const items: Array<{ key: string; value: LockItem; ttl: number }> = [];
    for (const ticketId of ticketIds) {
      items.push({
        key: ticketId,
        value: new LockItem(userId, ticketId, new Date(Date.now() + CompositeTicketRepository.ttl)),
        ttl: CompositeTicketRepository.ttl,
      });
    }
    await this.cacheStore.mset(items);
  }
  async areAvailable(
    ticketIds: string[],
    userId: UserId,
  ): Promise<{ areAvailable: boolean; unavailableTicketIds: string[] | undefined }> {
    Logger.debug(`Checking availability for tickets: ${ticketIds.join(', ')} for user: ${userId}`);
    const cachedResults = await this.cacheStore.mget<LockItem>(ticketIds);
    const unavailableTickets = cachedResults?.every((item) => item !== undefined);
    if (unavailableTickets) {
      const unavailableTicketIds = cachedResults.map((result) => result?.ticketId).filter((id) => id !== undefined);
      return {
        areAvailable: false,
        unavailableTicketIds: unavailableTicketIds.length > 0 ? unavailableTicketIds : undefined,
      };
    }
    return { areAvailable: true, unavailableTicketIds: undefined };
  }

  async increaseLockTime(ticketIds: string[], userId: UserId, ttl: number): Promise<void> {
    const items: Array<{ key: string; value: LockItem; ttl: number }> = [];
    for (const ticketId of ticketIds) {
      items.push({ key: ticketId, value: new LockItem(userId, ticketId, new Date(Date.now() + ttl)), ttl });
    }
    await this.cacheStore.mset(items);
  }

  async releaseLock(ticketIds: string[]): Promise<void> {
    await this.cacheStore.mdel(ticketIds);
  }

  async setReservation(userId: UserId, ticketIds: string[], bookingId: string): Promise<void> {
    await this.cacheStore.set<Reservation>(
      bookingId,
      new Reservation(bookingId, userId, ticketIds),
      CompositeTicketRepository.ttl,
    );
  }
}
