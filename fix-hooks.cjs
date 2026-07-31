const fs = require("node:fs");
const path = require("node:path");

function walk(dir) {
	let results = [];
	const list = fs.readdirSync(dir);
	list.forEach((file) => {
		file = path.join(dir, file);
		const stat = fs.statSync(file);
		if (stat?.isDirectory()) {
			results = results.concat(walk(file));
		} else {
			if (file.endsWith(".tsx") || file.endsWith(".ts")) {
				results.push(file);
			}
		}
	});
	return results;
}

const files = walk(path.join(__dirname, "apps/web/src/app"));

let totalFixed = 0;

files.forEach((file) => {
	let content = fs.readFileSync(file, "utf8");
	const original = content;

	// Pattern 3 updated to handle newlines and comments:
	// const { data = [], isLoading, error } = useQuery(
	//   // @ts-ignore - Assuming this route exists on the router
	//   trpc.approvals.list.queryOptions ? trpc.approvals.list.queryOptions() : { queryKey: ['approvals', 'list'], queryFn: () => [] }
	// );

	// We can just regex replace the whole useQuery block for this pattern if it has trpc.something.queryOptions ?
	content = content.replace(
		/useQuery\([\s\S]*?trpc\.([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\.queryOptions \?[\s\S]*?\);/g,
		"trpc.$1.$2.useQuery();",
	);

	if (content !== original) {
		fs.writeFileSync(file, content, "utf8");
		totalFixed++;
		console.log("Fixed", file);
	}
});

console.log("Total ternary files fixed:", totalFixed);
