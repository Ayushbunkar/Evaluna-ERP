async function run() {
	console.log("LOGGING IN VIA NEXT.JS API ENDPOINT...");

	const loginBody = {
		email: "putter@evaluna.com",
		password: "Password@123",
		rememberMe: true,
	};

	const response = await fetch("http://localhost:3001/api/auth/sign-in/email", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(loginBody),
	});

	console.log("Login Status:", response.status);
	const setCookie = response.headers.get("set-cookie");
	console.log("Set-Cookie headers:", setCookie);

	if (!response.ok) {
		const text = await response.text();
		console.log("Login failed details:", text);
		process.exit(1);
	}

	const resData = await response.json();
	console.log("Login Response Data:", JSON.stringify(resData, null, 2));

	if (setCookie) {
		// Extract token
		const match = setCookie.match(/evaluna.session_token=([^;]+)/);
		if (match) {
			const token = match[1];
			console.log("Extracted Session Token:", token);

			console.log("\nFETCHING /PUTTER WITH COOKIE...");
			const pageRes = await fetch("http://localhost:3001/putter", {
				headers: {
					cookie: `evaluna.session_token=${token}`,
				},
			});
			console.log("Page Response Status:", pageRes.status);
		}
	}

	process.exit(0);
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
