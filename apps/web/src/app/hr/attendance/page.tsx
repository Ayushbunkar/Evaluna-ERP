"use client";

import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import { type Column, DataTable } from "@evaluna/ui/components/data-table";
import { SearchFilter } from "@evaluna/ui/components/search-filter";
import { format } from "date-fns";
import { useState } from "react";
import { PageTransition } from "@/lib/animations";
import { trpc } from "@/lib/trpc/client";

export default function AttendanceTrackingPage() {
	const [searchTerm, setSearchTerm] = useState("");
	// Note: by default this fetches today's attendance.
	const { data: attendanceList, isLoading } = trpc.attendance.list.useQuery({});

	const columns: Column<any>[] = [
		{ key: "staff.name", header: "Employee", sortable: true },
		{ key: "date", header: "Date" },
		{ key: "clock_in_time", header: "Clock In" },
		{ key: "clock_out_time", header: "Clock Out" },
		{ key: "work_type", header: "Work Type" },
		{ key: "shift_status", header: "Status" },
	];

	// Filter data based on search term
	const filteredData =
		attendanceList
			?.map((record) => ({
				...record,
				"staff.name": record.staff?.name || "Unknown",
				date: record.date ? format(new Date(record.date), "MMM dd, yyyy") : "-",
				clock_in_time: record.clock_in_time
					? format(new Date(record.clock_in_time), "HH:mm a")
					: "-",
				clock_out_time: record.clock_out_time
					? format(new Date(record.clock_out_time), "HH:mm a")
					: "-",
			}))
			.filter(
				(record) =>
					record["staff.name"]
						?.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					record.shift_status?.toLowerCase().includes(searchTerm.toLowerCase()),
			) || [];

	return (
		<PageTransition className="flex flex-col gap-6">
			<div>
				<h1 className="font-bold text-3xl tracking-tight">
					Attendance Tracking
				</h1>
				<p className="text-muted-foreground text-sm">
					Manage and view details for attendance tracking.
				</p>
			</div>

			<Card className="border-border/50 bg-card/50 shadow-sm">
				<CardHeader className="p-4">
					<SearchFilter
						search={searchTerm}
						onSearchChange={setSearchTerm}
						searchPlaceholder="Search records..."
					/>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable
						data={filteredData}
						columns={columns}
						emptyMessage={
							isLoading
								? "Loading records..."
								: "No records found in this module yet."
						}
					/>
				</CardContent>
			</Card>
		</PageTransition>
	);
}
