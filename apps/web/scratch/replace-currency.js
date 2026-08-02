const fs = require("fs");
const path = require("path");

function walk(dir) {
	let results = [];
	const list = fs.readdirSync(dir);
	list.forEach((file) => {
		file = path.join(dir, file);
		const stat = fs.statSync(file);
		if (stat && stat.isDirectory()) {
			results = results.concat(walk(file));
		} else {
			if (file.endsWith(".tsx") || file.endsWith(".ts")) {
				results.push(file);
			}
		}
	});
	return results;
}

const files = walk(path.join(process.cwd(), "src"));
let changedFiles = 0;

files.forEach((file) => {
	let content = fs.readFileSync(file, "utf8");
	const orig = content;

	// Replace "en-US" inside formatCurrency with "en-IN"
	content = content.replace(
		/formatCurrency\(([^,]+),\s*["']en-US["']\)/g,
		'formatCurrency($1, "en-IN")',
	);

	// Replace `$${` with `₹${`
	content = content.replace(/\$\$\{/g, "₹${");

	// Replace `$120.50` with `₹120.50`
	content = content.replace(/\$([0-9]+(\.[0-9]+)?)/g, "₹$1");

	// Replace `> $ <` with `> ₹ <`
	content = content.replace(/>\s*\$\s*</g, "> ₹ <");

	// Replace `$\n{` or `$ {` with `₹ {`
	content = content.replace(/\$([ \t\n]*)\$\{/g, "₹$1${");

	if (orig !== content) {
		fs.writeFileSync(file, content, "utf8");
		changedFiles++;
		console.log(`Updated ${file}`);
	}
});

console.log(`Updated ${changedFiles} files.`);
