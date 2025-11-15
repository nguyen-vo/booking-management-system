import { sleep } from 'k6';
import http from 'k6/http';
import { Options } from 'k6/options';
/* @ts-ignore */
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.1.0/index.js';

export const options: Options = {
  scenarios: {
    search_events: {
      executor: 'ramping-vus',
      startVUs: 80,
      stages: [
        { duration: '3m', target: 80 },
        { duration: '5m', target: 510 },
        { duration: '3m', target: 0 }
      ],
      gracefulRampDown: '30s'
    }
  }
};
const token =
  'eyJhbGciOiJSUzI1NiIsImtpZCI6IjRmZWI0NGYwZjdhN2UyN2M3YzQwMzM3OWFmZjIwYWY1YzhjZjUyZGMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIzMjU1NTk0MDU1OS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImF1ZCI6IjMyNTU1OTQwNTU5LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTE2ODAzNDQyNTY2MzM0MTcxNjAwIiwiZW1haWwiOiJ2b244MDk3OUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6IjEwTVFyZ0hoN1dpWllUTm9ZWWkyLUEiLCJpYXQiOjE3NjMxNzA4NDQsImV4cCI6MTc2MzE3NDQ0NH0.V4bymdjvgNIPDuLyd6uWOcOc85PDfqJyi6mX9xvJ1ihlgmthTFugbP_3etCjuyB6JNqbvH35RSBTdkkL7D4KjdAMkshP0W9rH1ySX1wTaqDYbWGdLAP13gOlgbRsVUqxP8jylw1-SgJnPX7j1xD5YdNyYmzdAefguo_G33yijnSZ4YoUK9KO2XpDO-O4_5jiSkd4i2oMTZmEbZZZJJFniPq8BW3K5p2tCHMNRWPJt0t3ZXQ41KJauS56Jre4mK_mEhlRpgBH-zwnt8uhDMh5Z255LHqP3q_T2HtIM6jvSgycFuAnNT_n2lWPf9iNh7ZUMG5AAyIUwg0IXtKoXvqqfg';
const locations = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Houston',
  'Phoenix',
  'Philadelphia',
  'San Antonio',
  'San Diego',
  'Dallas',
  'San Jose'
];

export default () => {
  http.get(
    `https://search-service-685171395229.us-central1.run.app/api/search/events?location=${
      locations[randomIntBetween(0, locations.length - 1)]
    }`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-use-elasticsearch': 'false'
      }
    }
  );
  sleep(randomIntBetween(1, 5));
};
