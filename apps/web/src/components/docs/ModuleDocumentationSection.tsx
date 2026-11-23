"use client";

import { useState } from "react";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	Database,
	FileText,
	Download,
	Calculator,
	Package,
	ShoppingCart,
	Users,
	ArrowRight,
	CheckCircle2,
	Eye,
} from "lucide-react";
import { DOCS_GUIDES, type GuideContent } from "@/lib/docs-guides-data";
import { GuideDownloadModal } from "./GuideDownloadModal";

export function ModuleDocumentationSection() {
	const [activeGuide, setActiveGuide] = useState<GuideContent | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleOpenGuide = (guideKey: string) => {
		const guide = DOCS_GUIDES[guideKey];
		if (guide) {
			setActiveGuide(guide);
			setIsModalOpen(true);
		}
	};

	return (
		<section className="mb-16">
			<div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
				<div>
					<div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
						<Database className="h-4 w-4 text-primary" />
						<span>Enterprise SOP & Documentation</span>
					</div>
					<h2 className="font-bold text-3xl text-foreground tracking-tight sm:text-4xl">
						Module Documentation
					</h2>
					<p className="mt-1 text-sm text-muted-foreground max-w-2xl">
						Explore complete operational architectures, user manuals, and ethical compliance charters for core business modules. Download vector PDFs in English or Hindi.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
				{/* Core Modules Card */}
				<Card className="border border-border/70 bg-card text-card-foreground shadow-sm transition-all hover:border-primary/40">
					<CardHeader className="border-b border-border/50 pb-4">
						<div className="flex items-center space-x-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<Database className="h-5 w-5" />
							</div>
							<div>
								<h3 className="font-semibold text-xl text-foreground">
									Core Modules
								</h3>
								<p className="text-xs text-muted-foreground">
									Financial governance & inventory warehouse control
								</p>
							</div>
						</div>
					</CardHeader>
					<CardContent className="pt-6">
						<div className="space-y-6">
							{/* Financial Management */}
							<div className="rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors hover:bg-muted/40">
								<div className="flex items-center justify-between gap-2 mb-2">
									<h4 className="flex items-center font-semibold text-foreground text-base">
										<Calculator className="mr-2 h-4 w-4 text-primary" />
										Financial Management
									</h4>
									<span className="rounded-md border border-border/80 bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
										Finance SOP
									</span>
								</div>
								<p className="text-xs text-muted-foreground mb-3">
									Dual-authorization workflows, accounts payable/receivable, ledger integrity, and tax audits.
								</p>
								<ul className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-foreground/90">
									<li className="flex items-center gap-1.5">
										<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
										Accounts payable / receivable
									</li>
									<li className="flex items-center gap-1.5">
										<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
										Double-entry general ledger
									</li>
									<li className="flex items-center gap-1.5">
										<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
										Budget allocation & audit
									</li>
									<li className="flex items-center gap-1.5">
										<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
										Financial GSTR reporting
									</li>
								</ul>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleOpenGuide("finance-guide")}
									className="w-full sm:w-auto text-xs font-medium border-border hover:border-primary hover:bg-primary/10 hover:text-primary gap-1.5"
								>
									<Eye className="h-3.5 w-3.5 text-primary" />
									<span>View Docs / Download PDF</span>
								</Button>
							</div>

							{/* Inventory Management */}
							<div className="rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors hover:bg-muted/40">
								<div className="flex items-center justify-between gap-2 mb-2">
									<h4 className="flex items-center font-semibold text-foreground text-base">
										<Package className="mr-2 h-4 w-4 text-primary" />
										Inventory & Warehouse
									</h4>
									<span className="rounded-md border border-border/80 bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
										Operations SOP
									</span>
								</div>
								<p className="text-xs text-muted-foreground mb-3">
									Multi-warehouse bin routing, FEFO lot picking, stock transfer verification, and physical counts.
								</p>
								<ul className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-foreground/90">
									<li className="flex items-center gap-1.5">
										<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
										FEFO lot & batch tracking
									</li>
									<li className="flex items-center gap-1.5">
										<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
										Inter-branch transfer orders
									</li>
									<li className="flex items-center gap-1.5">
										<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
										Automated reorder triggers
									</li>
									<li className="flex items-center gap-1.5">
										<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
										Warehouse bin management
									</li>
								</ul>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleOpenGuide("operations-guide")}
									className="w-full sm:w-auto text-xs font-medium border-border hover:border-primary hover:bg-primary/10 hover:text-primary gap-1.5"
								>
									<Eye className="h-3.5 w-3.5 text-primary" />
									<span>View Docs / Download PDF</span>
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Business Operations Card */}
				<Card className="border border-border/70 bg-card text-card-foreground shadow-sm transition-all hover:border-primary/40">
					<CardHeader className="border-b border-border/50 pb-4">
						<div className="flex items-center space-x-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<FileText className="h-5 w-5" />
							</div>
							<div>
								<h3 className="font-semibold text-xl text-foreground">
									Business Operations
								</h3>
								<p className="text-xs text-muted-foreground">
									Point-of-sale terminal billing & workforce HR protocols
								</p>
							</div>
						</div>
					</CardHeader>
					<CardContent className="pt-6">
						<div className="space-y-6">
							{/* Sales & POS */}
							<div className="rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors hover:bg-muted/40">
								<div className="flex items-center justify-between gap-2 mb-2">
									<h4 className="flex items-center font-semibold text-foreground text-base">
										<ShoppingCart className="mr-2 h-4 w-4 text-primary" />
										Sales & Point of Sale (POS)
									</h4>
									<span className="rounded-md border border-border/80 bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
										Sales SOP
									</span>
								</div>
								<p className="text-xs text-muted-foreground mb-3">
									Barcode/QR checkout, unalterable billing transparency, WhatsApp receipts, and day-end shift closures.
								</p>
								<ul className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-foreground/90">
									<li className="flex items-center gap-1.5">
										<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
										High-speed POS cash register
									</li>
									<li className="flex items-center gap-1.5">
										<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
										Offline receipt generation
									</li>
									<li className="flex items-center gap-1.5">
										<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
										Customer credit limit controls
									</li>
									<li className="flex items-center gap-1.5">
										<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
										Sales analytics & cashier ledger
									</li>
								</ul>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleOpenGuide("sales-guide")}
									className="w-full sm:w-auto text-xs font-medium border-border hover:border-primary hover:bg-primary/10 hover:text-primary gap-1.5"
								>
									<Eye className="h-3.5 w-3.5 text-primary" />
									<span>View Docs / Download PDF</span>
								</Button>
							</div>

							{/* Human Resources */}
							<div className="rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors hover:bg-muted/40">
								<div className="flex items-center justify-between gap-2 mb-2">
									<h4 className="flex items-center font-semibold text-foreground text-base">
										<Users className="mr-2 h-4 w-4 text-primary" />
										Human Resources & Attendance
									</h4>
									<span className="rounded-md border border-border/80 bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
										HR & Conduct SOP
									</span>
								</div>
								<p className="text-xs text-muted-foreground mb-3">
									GPS geofence check-in, employee data privacy, leave accruals, and fair workplace ethics.
								</p>
								<ul className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-foreground/90">
									<li className="flex items-center gap-1.5">
										<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
										Geofenced mobile check-in
									</li>
									<li className="flex items-center gap-1.5">
										<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
										Automated payroll calculation
									</li>
									<li className="flex items-center gap-1.5">
										<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
										Employee records & compliance
									</li>
									<li className="flex items-center gap-1.5">
										<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
										POSH & workplace conduct code
									</li>
								</ul>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleOpenGuide("hr-guide")}
									className="w-full sm:w-auto text-xs font-medium border-border hover:border-primary hover:bg-primary/10 hover:text-primary gap-1.5"
								>
									<Eye className="h-3.5 w-3.5 text-primary" />
									<span>View Docs / Download PDF</span>
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Bilingual PDF Download Modal */}
			<GuideDownloadModal
				guide={activeGuide}
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
			/>
		</section>
	);
}
