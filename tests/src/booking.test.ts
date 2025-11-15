import { sleep } from 'k6';
import http from 'k6/http';
import { Options } from 'k6/options';
import users from '../data/users.json';
import tickets from '../data/grouped-tickets.json';
/* @ts-ignore */
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.1.0/index.js';

export const options: Options = {
  scenarios: {
    booking: {
      executor: 'ramping-vus',
      startVUs: 80,
      stages: [
        { duration: '10s', target: 80 },
        { duration: '3m', target: 200 },
        { duration: '5m', target: 510 },
        { duration: '3m', target: 0 }
      ],
      gracefulRampDown: '30s'
    }
  }
};

const token =
  'eyJhbGciOiJSUzI1NiIsImtpZCI6IjRmZWI0NGYwZjdhN2UyN2M3YzQwMzM3OWFmZjIwYWY1YzhjZjUyZGMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIzMjU1NTk0MDU1OS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImF1ZCI6IjMyNTU1OTQwNTU5LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTE2ODAzNDQyNTY2MzM0MTcxNjAwIiwiZW1haWwiOiJ2b244MDk3OUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6IjJzY2hSNFV2NkJmOXl2TzNsblFhT3ciLCJpYXQiOjE3NjMxNzQyMDIsImV4cCI6MTc2MzE3NzgwMn0.EFLeIZ1abitBV8PR7kujuxcvDOkvSy2ld2i3xJl5lDwMwmrnxwTjfivwrr_MsshMBVeLbxaeoj8_TwKIfEibUe-PdhZGcGu3yXvFR5kY3MI6stKgOqRSJ5dAc6-Aj1WmtVjsmcIJP0uqFeaI1WA7RMPJ3XQE5muBR0pwPBbgJYwGhfmq-uHSFYjfXVw4lCMqbG7iDH1uzksjzVxN7xt8moyXHOMJf9x3WddXyL0VAJGQ4-v8-kEGR7WNFB4TfLp9Vlz9VUNpQ0QEr9B_Ly2kAi93UPrNfnhNyngPkaKRMkxEJiGeFxGy4tkR750PPo0yRfb3JHvL7GHlCa24s7h2eg';
const events = Object.keys(tickets);

export default async () => {
  const event = events[randomIntBetween(0, events.length - 1)];
  const body = {
    userId: users[randomIntBetween(0, users.length - 1)].userId,
    ticketIds: [
      /* @ts-ignore */
      tickets[event][randomIntBetween(0, tickets[event].length - 1)],
      /* @ts-ignore */
      tickets[event][randomIntBetween(0, tickets[event].length - 1)]
    ]
  };
  const res = await http.asyncRequest(
    'POST',
    'https://booking-management-service-685171395229.us-central1.run.app/api/booking/bookings',
    /* @ts-ignore */
    body,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  const status = res.status;
  if (status === 200 || status === 201) {
    const reservationId = res.json('reservationId');
    sleep(randomIntBetween(1, 5));
    await http.asyncRequest(
      'PATCH',
      `https://booking-management-service-685171395229.us-central1.run.app/api/booking/bookings/${reservationId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  } else {
  }
};
