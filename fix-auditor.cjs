const fs = require("fs");
const path = require("path");

const basePath = path.join(
	"apps",
	"web",
	"src",
	"app",
	"(dashboards)",
	"auditor",
);

const dirs = ["upc", "receiving", "placement", "reports"];
for (const dir of dirs) {
	const fullPath = path.join(basePath, dir);
	if (!fs.existsSync(fullPath)) {
		fs.mkdirSync(fullPath, { recursive: true });
	}

	const code = `"use client";

import { PageTransition } from "@/lib/animations";

export default function Auditor${dir.charAt(0).toUpperCase() + dir.slice(1)}Page() {
    return (
        <PageTransition className="container mx-auto py-8">
            <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl capitalize">
                ${dir}
            </h1>
            <p className="mt-4 text-muted-foreground">
                Coming soon...
            </p>
        </PageTransition>
    );
}`;
	fs.writeFileSync(path.join(fullPath, "page.tsx"), code);
}

// Fix findings page
const findingsCode = `"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	ActivityIcon,
	CheckCircle2Icon,
	ShieldIcon,
} from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function AuditorFindingsPage() {
	const trpc = useTRPC();
	const {
		data: findings,
		isLoading,
		error,
	} = trpc.auditFindings.list.useQuery({});

	if (isLoading)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Loading findings...
			</div>
		);
	if (error)
		return (
			<div className="flex h-[200px] items-center justify-center text-destructive">
				{error.message || "Error loading findings"}
			</div>
		);

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Audit Findings
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						List of audit findings and issues
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Audit Activities
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/auditor">
							<ShieldIcon className="mr-1 h-3 w-3" /> Back to Dashboard
						</Link>
					</Button>
				</div>
			</div>

			{!findings || findings.length === 0 ? (
				<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No findings found
				</div>
			) : (
				<div className="overflow-x-auto">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHead className="text-left">ID</TableHead>
								<TableHead className="text-left">Title</TableHead>
								<TableHead className="text-left">Type</TableHead>
								<TableHead className="text-left">Severity</TableHead>
								<TableHead className="text-left">Status</TableHead>
								<TableHead className="text-left">Date</TableHead>
								<TableHead className="text-left">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{findings.map((f) => (
								<TableRow key={f.id}>
									<TableCell>{f.id}</TableCell>
									<TableCell>{f.title}</TableCell>
									<TableCell>{f.finding_type}</TableCell>
									<TableCell>
										<span
											className={\`rounded-full px-2 py-0.5 text-xs \${f.severity === "CRITICAL" ? "bg-red-100 text-red-800" : f.severity === "HIGH" ? "bg-orange-100 text-orange-800" : f.severity === "MEDIUM" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}\`}
										>
											{f.severity?.charAt(0).toUpperCase() + (f.severity?.slice(1).toLowerCase() ?? "")}
										</span>
									</TableCell>
									<TableCell>
										<span
											className={\`rounded-full px-2 py-0.5 text-xs \${f.status === "OPEN" ? "bg-red-100 text-red-800" : f.status === "UNDER_REVIEW" ? "bg-yellow-100 text-yellow-800" : f.status === "CORRECTIVE_ACTION_REQUIRED" ? "bg-orange-100 text-orange-800" : f.status === "RESOLVED" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}\`}
										>
											{f.status
												?.split("_")
												.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
												.join(" ")}
										</span>
									</TableCell>
									<TableCell>
										{f.created_at
											? new Date(f.created_at).toISOString().split("T")[0]
											: "N/A"}
									</TableCell>
									<TableCell className="flex flex-row gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => alert(\`View finding \${f.id}\`)}
										>
											<ActivityIcon className="mr-1 h-3 w-3" /> View
										</Button>
										{f.status !== "RESOLVED" && f.status !== "CLOSED" && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => alert(\`Resolve finding \${f.id}\`)}
											>
												<CheckCircle2Icon className="mr-1 h-3 w-3" /> Resolve
											</Button>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</PageTransition>
	);
}`;

fs.writeFileSync(path.join(basePath, "findings", "page.tsx"), findingsCode);

// Fix layout links (change /auditor/dashboard to /auditor)
let layoutCode = fs.readFileSync(path.join(basePath, "layout.tsx"), "utf8");
layoutCode = layoutCode.replace(
	/href="\/auditor\/dashboard"/g,
	'href="/auditor"',
);
fs.writeFileSync(path.join(basePath, "layout.tsx"), layoutCode);

console.log("All files fixed!");
