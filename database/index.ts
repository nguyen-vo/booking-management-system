/* eslint-disable @typescript-eslint/no-unused-vars */
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Event, seedElasticSearch } from 'elasticsearch';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'postgres_db',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'ticket_booking',
  synchronize: false,
});
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

async function getAllEvents() {
  const events = await dataSource.query<Array<Event>>(`
    SELECT e."eventId", e.name as eventName, e.date, e.description, e.type, e.status,
       l."locationId", l.name as "locationName", l.address as "locationAddress", l."seatCapacity" as "locationSeatCapacity",
       p."performerId", p.name as "performerName", p.description as "performerDescription",
       (SELECT COUNT("ticketId")  FROM tickets WHERE tickets."eventId" = e."eventId" AND tickets.status = 'Available') as "ticketsAvailable"
       FROM events e
        LEFT JOIN locations l ON e."locationId" = l."locationId"
        LEFT JOIN event_performers ep ON e."eventId" = ep."eventId"
        LEFT JOIN performers p ON ep."performerId" = p."performerId"
    `);
  if (events.length === 0) {
    throw new Error('No events found to index');
  }
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
      ('Morrison Amphitheatre', '18300 W Alameda Pkwy, Morrison, CO 80465', 9525)
      RETURNING "locationId", name;
    `);
    const performerResult = await dataSource.query<
      Array<{ performerId: string }>
    >(`
      INSERT INTO performers (name, description) VALUES
      ('Taylor Swift', 'Grammy-winning pop and country music artist'),
      ('Ed Sheeran', 'British singer-songwriter and musician'),
      ('Los Angeles Lakers', 'Professional NBA basketball team'),
      ('Chicago Bulls', 'Professional NBA basketball team'),
      ('Hamilton Cast', 'Broadway musical cast'),
      ('The Lion King Cast', 'Broadway musical cast')
      RETURNING "performerId", name;
    `);
    const eventResult = await dataSource.query<Array<{ eventId: string }>>(`
      INSERT INTO events (name, date, description, type, status, "locationId", "isPopular") VALUES
      ('Taylor Swift - Eras Tour', '${faker.date.future({ years: 1 }).toISOString()}', 'Experience the magic of Taylor Swift''s Eras Tour', 'Concert', 'Upcoming', '${locationResult[0].locationId}', true),
      ('Ed Sheeran Live', '${faker.date.future({ years: 1 }).toISOString()}', 'An intimate evening with Ed Sheeran', 'Concert', 'Upcoming', '${locationResult[1].locationId}', true),
      ('Lakers vs Bulls', '${faker.date.future({ years: 1 }).toISOString()}', 'NBA regular season game', 'Sports', 'Upcoming', '${locationResult[0].locationId}', true),
      ('Hamilton', '${faker.date.future({ years: 1 }).toISOString()}', 'The hit Broadway musical about Alexander Hamilton', 'Theater', 'Upcoming', '${locationResult[2].locationId}', false),
      ('The Lion King', '${faker.date.future({ years: 1 }).toISOString()}', 'Disney''s award-winning musical', 'Theater', 'Upcoming', '${locationResult[2].locationId}', false),
      ('Red Rocks Summer Concert', '${faker.date.future({ years: 1 }).toISOString()}', 'Independence Day celebration concert', 'Concert', 'Upcoming', '${locationResult[3].locationId}', false)
      RETURNING "eventId", name;
    `);
    await dataSource.query(`
      INSERT INTO event_performers ("eventId", "performerId") VALUES
      ('${eventResult[0].eventId}', '${performerResult[0].performerId}'),
      ('${eventResult[1].eventId}', '${performerResult[1].performerId}'),
      ('${eventResult[2].eventId}', '${performerResult[2].performerId}'),
      ('${eventResult[2].eventId}', '${performerResult[3].performerId}'),
      ('${eventResult[3].eventId}', '${performerResult[4].performerId}'),
      ('${eventResult[4].eventId}', '${performerResult[5].performerId}')
    `);
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
      const ticketCount = 10000;
      const ticketValues: Array<string> = [];

      for (let i = 1; i <= ticketCount; i++) {
        const seatNumber =
          faker.string.alpha({ length: 1, casing: 'upper' }) +
          faker.string.numeric({ allowLeadingZeros: true, length: 3 });
        const price = faker.number.float({ min: 20, max: 200 }).toFixed(2);
        const status = 'Available';
        console.log(
          `('${event.eventId}', '${seatNumber}', ${price}, '${status}')`,
        );
        ticketValues.push(
          `('${event.eventId}', '${seatNumber}', ${price}, '${status}')`,
        );
      }

      await dataSource.query(`
        INSERT INTO tickets ("eventId", "seatNumber", price, status) VALUES ${ticketValues.join(',')}
      `);
    }
    console.log('Database seeded successfully!');
    const events = await getAllEvents();
    await seedElasticSearch(events);
    console.log('Elasticsearch seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await dataSource.destroy();
  }
}

async function dropAll() {
  await dataSource.initialize();
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

dropAll()
  .then(() => {
    console.log('All tables dropped successfully');
    seed().catch((error) => {
      console.error('Error seeding database:', error);
    });
  })
  .catch((error) => {
    console.error('Error dropping tables:', error);
  });
