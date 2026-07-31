"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { BookOpen, ScrollText } from "lucide-react";
import Link from "next/link";
import {
	AnimatedCard,
	motion,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";

export default function AccountingDashboard() {
	return (
		<PageTransition>
			<div className="mx-auto max-w-5xl space-y-6 p-6">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						Accounting Module
					</h1>
					<p className="mt-2 text-muted-foreground">
						Manage your Chart of Accounts and Journal Vouchers.
					</p>
				</div>

				<StaggerList className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<StaggerItem>
						<AnimatedCard>
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<BookOpen className="h-5 w-5" />
										Chart of Accounts
									</CardTitle>
									<CardDescription>
										View and manage your account hierarchy.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<Link href="/admin/accounting/coa">
										<motion.div
											whileHover={{ scale: 1.02 }}
											whileTap={{ scale: 0.98 }}
										>
											<Button className="w-full">
												Go to Chart of Accounts
											</Button>
										</motion.div>
									</Link>
								</CardContent>
							</Card>
						</AnimatedCard>
					</StaggerItem>

					<StaggerItem>
						<AnimatedCard>
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<ScrollText className="h-5 w-5" />
										Journal Vouchers
									</CardTitle>
									<CardDescription>
										Create manual double-entry journals.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<Link href="/admin/accounting/journal">
										<motion.div
											whileHover={{ scale: 1.02 }}
											whileTap={{ scale: 0.98 }}
										>
											<Button className="w-full" variant="secondary">
												Go to Journal Vouchers
											</Button>
										</motion.div>
									</Link>
								</CardContent>
							</Card>
						</AnimatedCard>
					</StaggerItem>
				</StaggerList>
			</div>
		</PageTransition>
	);
}
