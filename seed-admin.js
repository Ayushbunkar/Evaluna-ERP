fetch('http://localhost:3000/api/seed-admin', { method: 'POST' })
  .then(res => res.json())
  .then(data => console.log('Seed Admin Result:', data))
  .catch(err => console.error('Seed Admin Error:', err));
