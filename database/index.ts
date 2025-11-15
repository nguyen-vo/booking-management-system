/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Event, seedElasticSearch } from 'elasticsearch';
import dotenv from 'dotenv';
dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'postgres_db',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'ticket_booking',
  synchronize: false,
  ssl: {
    rejectUnauthorized: false,
  },
});
const numberOfEvents = parseInt(process.env.NUMBER_OF_EVENTS || '100');
const numberOfTicketsPerEvent = parseInt(
  process.env.NUMBER_OF_TICKETS_PER_EVENT || '100',
);
async function createTables() {
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS locations (
      "locationId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      address TEXT NOT NULL,
      "seatCapacity" INTEGER NOT NULL,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS performers (
      "performerId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await dataSource.query(`
    DROP TYPE IF EXISTS event_type_enum CASCADE;
    CREATE TYPE event_type_enum AS ENUM ('Concert', 'Sports', 'Theater', 'Festival');
  CREATE TABLE IF NOT EXISTS events (
    "eventId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    date TIMESTAMP NOT NULL,
    description TEXT,
    type event_type_enum NOT NULL,
    "isPopular" BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Ongoing', 'Completed')),
    "locationId" UUID REFERENCES locations("locationId"),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS event_performers (
      "eventId" UUID REFERENCES events("eventId") ON DELETE CASCADE,
      "performerId" UUID REFERENCES performers("performerId") ON DELETE CASCADE,
      PRIMARY KEY ("eventId", "performerId")
    );
  `);

  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS users (
      "userId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      "bookingId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" UUID REFERENCES users("userId"),
      "bookingDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(50) DEFAULT 'Confirmed',
      "totalAmount" DECIMAL(10,2) NOT NULL,
      "bookingReference" VARCHAR(255) NOT NULL,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS tickets (
      "ticketId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "eventId" UUID REFERENCES events("eventId") ON DELETE CASCADE,
      "bookingId" UUID REFERENCES bookings("bookingId") ON DELETE SET NULL,
      "seatNumber" VARCHAR(50) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'Available' CHECK (status IN ('Available', 'Reserved', 'Sold')),
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getAllEvents(page: number = 1, pageSize: number = 100) {
  const offset = (page - 1) * pageSize;

  const events = await dataSource.query<Array<Event>>(
    `
  WITH ticket_counts AS (
      SELECT 
        "eventId",
        COUNT(*) FILTER (WHERE status = 'Available') as "ticketsAvailable"
      FROM tickets
      GROUP BY "eventId"
    ),
    event_performers_agg AS (
      SELECT 
        ep."eventId",
        json_agg(json_build_object(
          'performerId', p."performerId",
          'performerName', p.name,
          'performerDescription', p.description
        )) as performers
      FROM event_performers ep
      JOIN performers p ON ep."performerId" = p."performerId"
      GROUP BY ep."eventId"
    )
    SELECT 
      e."eventId",
      e.name as "eventName",
      e.date,
      e.description,
      e.type,
      e.status,
      e."isPopular",
      l."locationId",
      l.name as "locationName",
      l.address as "locationAddress",
      l."seatCapacity" as "locationSeatCapacity",
      COALESCE(tc."ticketsAvailable", 0)::int as "ticketsAvailable",
      epa.performers
    FROM events e
    LEFT JOIN locations l ON e."locationId" = l."locationId"
    LEFT JOIN ticket_counts tc ON e."eventId" = tc."eventId"
    LEFT JOIN event_performers_agg epa ON e."eventId" = epa."eventId"
    ORDER BY e."createdAt" DESC
    LIMIT $1 OFFSET $2
    `,
    [pageSize, offset],
  );

  return events;
}
async function seed() {
  try {
    console.log('Database connected for seeding...');
    await createTables();
    console.log('Tables created successfully.');
    await dataSource.query('TRUNCATE TABLE bookings CASCADE');
    await dataSource.query('TRUNCATE TABLE tickets CASCADE');
    await dataSource.query('TRUNCATE TABLE event_performers CASCADE');
    await dataSource.query('TRUNCATE TABLE events CASCADE');
    await dataSource.query('TRUNCATE TABLE performers CASCADE');
    await dataSource.query('TRUNCATE TABLE locations CASCADE');
    await dataSource.query('TRUNCATE TABLE users CASCADE');
    console.log('Tables truncated successfully.');
    const locationResult = await dataSource.query<
      Array<{ locationId: string }>
    >(`
      INSERT INTO locations (name, address, "seatCapacity") VALUES
      ('Madison Square Garden', '4 Pennsylvania Plaza, New York, NY 10001', 20000),
      ('Red Rocks Amphitheatre', '11 W 53rd St, New York, NY 10019', 9525),
      ('Hollywood Bowl', '2301 Highland Ave, Los Angeles, CA 90068', 17500),
      ('Chicago Theatre', '175 N State St, Chicago, IL 60601', 3600),
      ('Morrison Amphitheatre', '18300 W Alameda Pkwy, Morrison, CO 80465', 9525),
      ('Walt Disney Concert Hall', '111 S Grand Ave, Los Angeles, CA 90012', 2265),
      ('The Forum', '3900 W Manchester Blvd, Inglewood, CA 90305', 17500),
      ('Staples Center', '1111 S Figueroa St, Los Angeles, CA 90015', 21000),
      ('State Farm Arena', '1 State Farm Dr, Atlanta, GA 30303', 21000),
      ('Mercedes-Benz Stadium', '1 AMB Dr NW, Atlanta, GA 30313', 71000),
      ('PNC Park', '115 Federal St, Pittsburgh, PA 15212', 38000),
      ('Fenway Park', '4 Yawkey Way, Boston, MA 02215', 37755),
      ('Wrigley Field', '1060 W Addison St, Chicago, IL 60613', 41649),
      ('Yankee Stadium', '1 E 161st St, Bronx, NY 10451', 47309),
      ${Array.from({ length: 100 })
        .map(
          () =>
            `('${faker.location.city().replace(/'/g, ' ')} ${faker.helpers.arrayElement(['Stadium', 'Arena', 'Theatre'])}', '${faker.location.streetAddress().replace(/'/g, ' ')}, ${faker.location.city().replace(/'/g, ' ')}, ${faker.location.state().replace(/'/g, ' ')}, ${faker.location.zipCode().replace(/'/g, ' ')})', ${faker.number.int({ min: 5000, max: 80000 })})`,
        )
        .join(',')}
      RETURNING "locationId", name;
    `);
    console.log('Locations seeded successfully.');
    const performers = Array.from({ length: 50 }).map(() => ({
      // eslint-disable-next-line no-useless-escape
      name: faker.music.artist().replace(/'/g, ' '),
      description: faker.lorem.words({ min: 10, max: 20 }),
    }));

    const performerResult = await dataSource.query<
      Array<{ performerId: string }>
    >(`
      INSERT INTO performers (name, description) VALUES
      ('Taylor Swift', 'Grammy-winning pop and country music artist'),
      ('Ed Sheeran', 'British singer-songwriter and musician'),
      ${performers.map((p) => `('${p.name}', '${p.description}')`).join(',')}
      RETURNING "performerId", name;
    `);
    console.log('Performers seeded successfully.');
    const eventInfos = Array.from({ length: numberOfEvents }).map(() => {
      return {
        name:
          faker.music.artist().replace(/'/g, ' ') +
          ' - ' +
          faker.helpers.arrayElement([
            'Concert',
            'Sports',
            'Theater',
            'Festival',
          ]),
        date: faker.date.future({ years: 1 }).toISOString(),
        description: faker.lorem.text(),
        type: faker.helpers.arrayElement([
          'Concert',
          'Sports',
          'Theater',
          'Festival',
        ]),
        status: 'Upcoming',
        locationId: faker.helpers.arrayElement(locationResult).locationId,
      };
    });
    const eventResult = await dataSource.query<Array<{ eventId: string }>>(`
      INSERT INTO events (name, date, description, type, status, "locationId", "isPopular") VALUES
      ('Taylor Swift - Eras Tour', '${faker.date.future({ years: 1 }).toISOString()}', 'Experience the magic of Taylor Swift''s Eras Tour', 'Concert', 'Upcoming', '${locationResult[0].locationId}', true),
      ('Ed Sheeran Live', '${faker.date.future({ years: 1 }).toISOString()}', 'An intimate evening with Ed Sheeran', 'Concert', 'Upcoming', '${locationResult[1].locationId}', true),
      ${eventInfos.map((e) => `('${e.name}', '${e.date}', '${e.description}', '${e.type}', '${e.status}', '${e.locationId}', false)`).join(',')}
      RETURNING "eventId", name;
    `);
    console.log('Events seeded successfully.');
    await dataSource.query(`
      INSERT INTO event_performers ("eventId", "performerId") VALUES
      ('${eventResult[0].eventId}', '${performerResult[0].performerId}'),
      ('${eventResult[1].eventId}', '${performerResult[1].performerId}'),
      ${eventResult
        .slice(2)
        .map(
          (res) =>
            `('${res.eventId}', '${faker.helpers.arrayElement(performerResult).performerId}')`,
        )
        .join(',')}
    `);
    console.log('Event-Performers relationships seeded successfully.');
    const userValues = new Array(100)
      .fill(null)
      .map(
        () => `('${faker.internet.username()}', '${faker.internet.email()}')`,
      )
      .join(',');

    await dataSource.query(`
      INSERT INTO users (username, email) VALUES ${userValues}
    `);
    for (const event of eventResult) {
      const ticketCount = numberOfTicketsPerEvent;
      const ticketValues: Array<string> = [];

      for (let i = 1; i <= ticketCount; i++) {
        const seatNumber =
          faker.string.alpha({ length: 1, casing: 'upper' }) +
          faker.string.numeric({ allowLeadingZeros: true, length: 3 });
        const price = faker.number.float({ min: 20, max: 200 }).toFixed(2);
        const status = 'Available';
        ticketValues.push(
          `('${event.eventId}', '${seatNumber}', ${price}, '${status}')`,
        );
      }

      await dataSource.query(`
        INSERT INTO tickets ("eventId", "seatNumber", price, status) VALUES ${ticketValues.join(',')}
      `);
    }
    console.log('Database seeded successfully!');
    console.log('Elasticsearch seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await dataSource.destroy();
  }
}

async function dropAll() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return dataSource.query(`
    DROP TABLE IF EXISTS bookings CASCADE;
    DROP TABLE IF EXISTS tickets CASCADE;
    DROP TABLE IF EXISTS event_performers CASCADE;
    DROP TABLE IF EXISTS events CASCADE;
    DROP TABLE IF EXISTS performers CASCADE;
    DROP TABLE IF EXISTS locations CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);
}
async function createIndexes() {
  await dataSource.query(`
    CREATE INDEX IF NOT EXISTS idx_tickets_eventid_status ON tickets("eventId", status);
    CREATE INDEX IF NOT EXISTS idx_event_performers_eventid ON event_performers("eventId");
    CREATE INDEX IF NOT EXISTS idx_events_createdate ON events("createdAt" DESC);
  `);
  console.log('Indexes created successfully.');
}
async function seedElastic() {
  console.log('Seeding Elasticsearch from database...');
  let page = 1;
  const pageSize = 500;
  while (true) {
    const batch = await getAllEvents(page, pageSize);
    if (batch.length === 0) {
      break;
    }
    await seedElasticSearch(batch);
    console.log(
      `Seeded Elasticsearch with page ${page} (${batch.length} events)`,
    );
    page++;
  }
}

async function main() {
  console.log('Initializing database connection for main execution...');
  await dataSource.initialize();
  console.log('Database connection established for main execution...');
  // await dropAll()
  // console.log('All tables dropped successfully');
  // await seed();
  await createIndexes();
  await seedElastic();
}
main().catch((error) => {
  console.error('Error in main execution:', error);
});

// dropAll()
// .then(() => {
//   console.log('All tables dropped successfully');
//   seed().catch((error) => {
//     console.error('Error seeding database:', error);
//   });
// })
// .then(() =>
//   seedElastic().catch((error) => {
//     console.error('Error seeding Elasticsearch:', error);
//   }),
// )
// .catch((error) => {
//   console.error('Error dropping tables:', error);
// });
