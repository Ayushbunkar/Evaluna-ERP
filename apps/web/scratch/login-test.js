const http = require('http');

async function test() {
  const trpcRes = await fetch("http://localhost:3001/api/trpc/customers.list?batch=1&input=%7B%220%22%3A%7B%7D%7D");
  console.log("TRPC Status:", trpcRes.status);
  const data = await trpcRes.text();
  console.log("TRPC Data:", data);
}

test();
