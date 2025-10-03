/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Client as ESClient, HttpConnection } from '@elastic/elasticsearch';

export interface Event {
  eventId: string;
  name: string;
  date: Date;
  description: string;
  type: string;
  status: string;
  ticketsAvailable: number;
  locationId: string;
  locationName: string;
  locationAddress: string;
  locationSeatCapacity: number;
  performerId: string;
  performerName: string;
  performerDescription: string;
}
const esClient = new ESClient({
  node: `${process.env.ELASTICSEARCH_NODE || 'http://localhost:9200'}`,
  Connection: HttpConnection,
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY || 'changeme',
  },
  requestTimeout: 60000,
  pingTimeout: 60000,
});
async function createEsIndex() {
  let exist = false;
  try {
    await esClient.indices.get({ index: 'events' });
    exist = true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    exist = false;
  }
  if (!exist) {
    await esClient.indices.create({
      index: 'events',
      mappings: {
        properties: {
          eventId: { type: 'keyword' },
          name: { type: 'text' },
          date: { type: 'date' },
          type: { type: 'keyword' },
          status: { type: 'keyword' },
          description: { type: 'text' },
          ticketsAvailable: { type: 'integer' },
          location: {
            properties: {
              locationId: { type: 'keyword' },
              name: { type: 'text' },
              address: { type: 'text' },
              seatCapacity: { type: 'integer' },
            },
          },
          performers: {
            type: 'nested',
            properties: {
              performerId: { type: 'keyword' },
              name: { type: 'text' },
              description: { type: 'text' },
            },
          },
        },
      },
    });
    console.log('Elasticsearch index created successfully.');
    return false;
  } else {
    console.log('Elasticsearch index already exists.');
    return true;
  }
}

async function bulkIndexEvents(events: Array<Event>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const eventPerformers = new Map<
    string,
    Array<{
      performerId: string;
      name: string;
      description: string;
    }>
  >();
  for (const event of events) {
    if (!eventPerformers.has(event.eventId)) {
      eventPerformers.set(event.eventId, []);
    }
    eventPerformers.get(event.eventId)?.push({
      performerId: event.performerId,
      name: event.performerName,
      description: event.performerDescription,
    });
  }

  const body = events.flatMap((event) => [
    { index: { _index: 'events', _id: event.eventId } },
    {
      eventId: event.eventId,
      name: event.name,
      date: event.date,
      description: event.description,
      type: event.type,
      status: event.status,
      ticketsAvailable: event.ticketsAvailable,
      location: {
        locationId: event.locationId,
        name: event.locationName,
        address: event.locationAddress,
        seatCapacity: event.locationSeatCapacity,
      },
      performers:
        eventPerformers.get(event.eventId)?.filter((p) => p.performerId) || [],
    },
  ]);
  const bulkResponse = await esClient.bulk({ refresh: true, body });

  if (bulkResponse.errors) {
    const erroredDocuments: Array<any> = [];
    for (let i = 0; i < bulkResponse.items.length; i++) {
      const action = bulkResponse.items[i];
      if (action.index && action.index.error) {
        erroredDocuments.push({
          status: action.index.status,
          error: action.index.error,
          operation: body[i * 2],
          document: body[i * 2 + 1],
        });
      }
    }
    console.log(erroredDocuments);
  } else {
    console.log(
      `Successfully indexed ${events.length} events to Elasticsearch.`,
    );
  }
}

export async function seedElasticSearch(events: Array<Event>) {
  try {
    await esClient.ping();
    console.log('Elasticsearch cluster is up!');
    const exist = await createEsIndex();
    if (!exist) {
      await bulkIndexEvents(events);
    }
  } catch (error) {
    console.error('Error seeding Elasticsearch:', error.message);
    console.dir(error, { depth: null });
  }
}
