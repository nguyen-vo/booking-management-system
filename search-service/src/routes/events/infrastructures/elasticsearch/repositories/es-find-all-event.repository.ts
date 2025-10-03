import { AggregationsAggregate, QueryDslQueryContainer, SearchResponse } from '@elastic/elasticsearch/lib/api/types';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { ElasticsearchService } from 'src/core/elasticsearch/elasticsearch.service';
import { FindAllEventRepository } from 'src/routes/events/application/ports/find-all-events.repository';
import { FindAllEventsQuery } from 'src/routes/events/application/queries/find-all-events/find-all-events.query';
import { Event } from 'src/routes/events/domain/event';

@Injectable()
export class EsFindAllEventRepository implements FindAllEventRepository {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async findAll(query: FindAllEventsQuery): Promise<{ events: Event[]; total: number }> {
    const res = await this.elasticsearchService.client.search<Event>({
      index: 'events',
      from: query.page,
      size: query.limit,
      query: {
        bool: {
          should: [
            ...this._getTextQuery('name', query.name),
            ...this._getDateQuery(query.date),
            ...this._getTextQuery('type', query.type),
            ...this._getTextQuery('status', query.status),
            ...this._getLocationQuery(query.location),
          ],
          minimum_should_match: 1,
        },
      },
    });
    const events = this._mapToEvent(res);
    const total = events.length;
    const result: { events: Event[]; total: number } = { events, total };
    return result as unknown as Promise<{ events: Event[]; total: number }>;
  }
  private _getTextQuery(property: string, value: string | undefined) {
    if (value) {
      return [{ match: { [property]: { query: String(value), fuzziness: 'AUTO' } } }];
    }
    return [];
  }

  private _getDateQuery(dateString: string | undefined) {
    if (!dateString) {
      return [];
    }
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return [];
    }

    return [{ match: { date: { query: date.toISOString() } } }];
  }

  private _getLocationQuery(location: string | undefined): QueryDslQueryContainer[] {
    if (!location) {
      return [];
    }
    return [
      {
        match: {
          'location.name': {
            query: location,
            fuzziness: 'AUTO',
          },
        },
      },
      {
        match: {
          'location.address': {
            query: location,
            fuzziness: 'AUTO',
          },
        },
      },
    ];
  }

  private _mapToEvent(result: SearchResponse<Event, Record<string, AggregationsAggregate>>) {
    const hitsResult = result.hits;
    const hits = hitsResult.hits;
    if (hits.length === 0) {
      return [];
    }
    const events: Array<Event> = [];
    for (const hit of hits) {
      const source = hit._source;
      if (source) {
        events.push(source);
      }
    }
    return events;
  }
}
