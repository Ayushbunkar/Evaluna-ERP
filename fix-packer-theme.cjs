const fs = require("fs");
const path = require("path");

const dirPath = path.join(
	"apps",
	"web",
	"src",
	"app",
	"(dashboards)",
	"packer",
);

function replacePurpleInFile(filePath) {
	if (fs.existsSync(filePath)) {
		let content = fs.readFileSync(filePath, "utf8");
		content = content.replace(/purple/g, "blue");
		fs.writeFileSync(filePath, content);
		console.log(`Updated ${filePath}`);
	}
}

function processDirectory(dir) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			processDirectory(fullPath);
		} else if (
			entry.isFile() &&
			(entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))
		) {
			replacePurpleInFile(fullPath);
		}
	}
}

processDirectory(dirPath);
console.log("Finished updating theme to standard blue!");
