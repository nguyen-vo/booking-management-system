import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TicketRepository } from '../../application/ports/ticket.repository';
import { In, Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserId } from 'src/core/interfaces';
import { LockItem } from '../entities/lock-item.entity';
import { Reservation } from '../../domain/reservation.entity';

@Injectable()
export class CompositeTicketRepository implements TicketRepository {
  private static readonly ttl = 10 * 60 * 1000;
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
    const cachedResults = await this.cacheStore.mget<LockItem>(ticketIds);
    Logger.debug(
      `Tickets locked: ${JSON.stringify(cachedResults, (key, value: unknown) => {
        if (value === undefined) return 'undefined';
        return value;
      })}`,
    );
  }
  async areAvailable(
    ticketIds: string[],
    userId: UserId,
  ): Promise<{ areAvailable: boolean; unavailableTicketIds: string[] | undefined }> {
    Logger.debug(`Checking availability for tickets: ${ticketIds.join(', ')} for user: ${userId}`);
    const cachedResults = await this.cacheStore.mget<LockItem>(ticketIds);
    const unavailableTickets = cachedResults?.some((item) => {
      return item !== undefined;
    });
    Logger.debug(
      `Cached Results: ${JSON.stringify(cachedResults, (key, value: unknown) => {
        if (value === undefined) return 'undefined';
        return value;
      })}`,
    );
    if (unavailableTickets) {
      Logger.debug(
        `Tickets are not available, existing locks found ${JSON.stringify(cachedResults)}, unavailable tickets: ${unavailableTickets}`,
      );
      const unavailableTicketIds = cachedResults.map((result) => result?.ticketId).filter((id) => id !== undefined);
      return {
        areAvailable: false,
        unavailableTicketIds: unavailableTicketIds.length > 0 ? unavailableTicketIds : undefined,
      };
    }
    const tickets = await this.ticketRepository.find({
      where: {
        ticketId: In(ticketIds),
        status: 'Available',
      },
    });
    const foundTickets = tickets.map((ticket) => ticket.ticketId);
    const availableTickets = tickets.length;
    if (availableTickets === 0 || availableTickets < ticketIds.length) {
      Logger.debug(`Tickets are not available, found ${availableTickets} out of ${ticketIds.length}`);
      Logger.debug(`Found tickets: ${foundTickets.join(', ')}`);
      const unavailableTicketIds = ticketIds.filter((id) => !foundTickets.includes(id));
      return {
        areAvailable: false,
        unavailableTicketIds: unavailableTicketIds.length > 0 ? unavailableTicketIds : undefined,
      };
    }
    Logger.debug(`Tickets are available, found ${availableTickets} out of ${ticketIds.length}`);
    Logger.debug(`Found tickets: ${foundTickets.join(', ')}`);
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
