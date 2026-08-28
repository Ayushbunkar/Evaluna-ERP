const fs = require("fs");
const path = "D:\\Evaluna ERP\\apps\\web\\src\\lib\\trpc\\routers\\customer.ts";
const content = fs.readFileSync(path, "utf8");
// Split into lines
const lines = content.split("\n");
// Line numbers are 1-indexed
// Fix 1: line 183 (index 182) add comma after the brace if not already present
if (lines[182].trimEnd() === "}") {
	lines[182] = lines[182].trimEnd() + ",";
}
// Fix 2: line 396 (index 395) add comma after the brace
if (lines[395].trimEnd() === "}") {
	lines[395] = lines[395].trimEnd() + ",";
}
// Join back
const newContent = lines.join("\n");
fs.writeFileSync(path, newContent);
console.log("Fixed");
