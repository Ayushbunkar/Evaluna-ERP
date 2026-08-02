const https = require('https');

https.get('https://evaluna-erp-web.vercel.app/api/trpc/customers.list?batch=1&input=%7B%220%22%3A%7B%7D%7D', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Body:', data.substring(0, 500))); // Print first 500 chars of HTML
});
