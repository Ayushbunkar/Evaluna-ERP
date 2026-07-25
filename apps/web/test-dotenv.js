const { createRequire } = require("node:module");
const _require = createRequire(process.cwd() + "/src/lib/db/index.ts");
_require("dotenv").config({ path: ".env.local" });
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "FOUND" : "NOT FOUND");
