import { PubSub } from '@google-cloud/pubsub';

const client = new PubSub({ projectId: 'ticket-booking-471523' });
const topicName = 'projects/ticket-booking-471523/topics/reservation-confirmed';
const eventId = 'd5064abd-b1ba-487c-81a2-4272ca1ed6ef';

async function testConfirmed() {
  const userId = 'de1f6a17-a4ea-4583-86f0-f321c6e43180';
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

testConfirmed().catch(console.error);
// testExpired().catch(console.error);
