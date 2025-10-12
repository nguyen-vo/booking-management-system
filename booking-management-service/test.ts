import { PubSub } from '@google-cloud/pubsub';

const client = new PubSub({ projectId: 'ticket-booking-471523' });
const topicName = 'projects/ticket-booking-471523/topics/reservation-confirmed';
const eventId = '68e31f94-9d60-4783-8fda-ce9b4afc1a67';

async function testConfirmed() {
  const userId = '71a0bde2-ca1f-4f61-a536-da485e0d98bd';
  const attributes = {
    eventId: eventId,
    eventType: 'reservation-confirmed',
    createdTime: new Date().toISOString(),
    publisher: 'booking-management-service',
  };
  const topic = client.topic(topicName, { messageOrdering: true });
  await topic.publishMessage({
    attributes,
    json: { userId, eventId },
    orderingKey: eventId,
  });
}

async function testExpired() {
  const userId = 'c55a00c4-fcfd-46b1-a8a2-4644f2540eaa';
  const attributes = {
    eventId,
    eventType: 'reservation-expired',
    createdTime: new Date().toISOString(),
    publisher: 'booking-management-service',
  };
  const topic = client.topic(topicName, { messageOrdering: true });
  await topic.publishMessage({
    attributes,
    json: { userId, eventId },
    orderingKey: eventId,
  });
}

// testConfirmed().catch(console.error);
testExpired().catch(console.error);
