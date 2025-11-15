const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./tickets copy.json', 'utf8'));
const grouped = {};

data.forEach(item => {
  if (!grouped[item.eventId]) {
    grouped[item.eventId] = [];
  }
  grouped[item.eventId].push(item.ticketId);
});

fs.writeFileSync('./tickets copy.json', JSON.stringify(grouped, null, 2), 'utf8');
console.log('Done! Grouped', Object.keys(grouped).length, 'events with', data.length, 'total tickets');
