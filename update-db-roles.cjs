require("dotenv").config();
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const roles = {
	"superadmin@evaluna.com": "superadmin",
	"manager@evaluna.com": "manager",
	"picker@evaluna.com": "picker",
	"packer@evaluna.com": "packer",
	"checker@evaluna.com": "checker",
	"putter@evaluna.com": "putter",
	"driver@evaluna.com": "driver",
	"admin@evaluna.com": "admin",
	"hr@evaluna.com": "hr",
	"auditor@evaluna.com": "auditor",
	"sales@evaluna.com": "sales_person",
	"billing@evaluna.com": "billing",
	"marketing@evaluna.com": "marketing",
};

async function fixRoles() {
	for (const [email, role] of Object.entries(roles)) {
		const isSuper = role === "superadmin" || role === "admin";
		await pool.query(
			'UPDATE public."user" SET role = $1, is_superadmin = $2 WHERE email = $3',
			[role, isSuper, email],
		);
		console.log("Fixed", email, "to", role);
	}
	process.exit(0);
}

fixRoles().catch(console.error);
