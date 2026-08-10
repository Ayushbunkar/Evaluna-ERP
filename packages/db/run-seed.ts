import { GET } from "../../apps/web/src/app/api/seed-all/route";

async function run() {
	console.log("Running seed...");
	const response = await GET();
	const data = await response.json();
	console.log(data);
	process.exit(0);
}

run();
