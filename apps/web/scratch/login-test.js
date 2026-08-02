const http = require('http');

async function test() {
  // Login
  const res = await fetch("http://localhost:3001/api/auth/sign-in/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Origin": "http://localhost:3001" },
    body: JSON.stringify({ email: "admin@evaluna.com", password: "test1234" }),
  });
  
  if (!res.ok) {
    console.error("Login failed:", res.status, await res.text());
    return;
  }
  
  const cookies = res.headers.get("set-cookie");
  console.log("Logged in! Cookies:", cookies);
  
  // Extract session token
  const tokenMatch = cookies?.match(/better-auth\.session_token=([^;]+)/);
  if (!tokenMatch) {
    console.error("No session token found in cookies!");
    return;
  }
  
  const token = tokenMatch[1];
  
  // Fetch TRPC dashboard
  const trpcRes = await fetch("http://localhost:3001/api/trpc/dashboard.getKpis?batch=1&input=%7B%220%22%3A%7B%7D%7D", {
    headers: {
      "cookie": `better-auth.session_token=${token}`
    }
  });
  
  console.log("TRPC Status:", trpcRes.status);
  const data = await trpcRes.text();
  console.log("TRPC Data:", data);
}

test();
