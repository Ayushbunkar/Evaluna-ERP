"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Header,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from "@evaluna/ui/components/table";
import { ActivityIcon, CalendarCheckIcon } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function HRAttendancePage() {
	const trpc = useTRPC();
	const locale = useLocale();
	const {
		data: attendanceRecords,
		isLoading,
		error,
	} = trpc.hr.getAttendanceRecords.useQuery();

	if (isLoading)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Loading...
			</div>
		);
	if (error)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Error loading attendance
			</div>
		);

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Attendance Records
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						View daily attendance
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> HR Activities
					</Button>
				</div>
			</div>

			{!attendanceRecords || attendanceRecords.length === 0 ? (
				<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No attendance records found
				</div>
			) : (
				<div className="overflow-x-auto">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHeader className="text-left">Date</TableHeader>
								<TableHeader className="text-left">Employee</TableHeader>
								<TableHeader className="text-left">Check In</TableHeader>
								<TableHeader className="text-left">Check Out</TableHeader>
								<TableHeader className="text-left">Status</TableHeader>
								<TableHeader className="text-left">Actions</TableHeader>
							</TableRow>
						</TableHeader>
						<TableBody>
							{attendanceRecords.map((rec) => (
								<TableRow key={rec.id}>
									<TableCell>{rec.date}</TableCell>
									<TableCell>{rec.employee_name}</TableCell>
									<TableCell>{rec.check_in || "N/A"}</TableCell>
									<TableCell>{rec.check_out || "N/A"}</TableCell>
									<TableCell>
										<span
											className={`rounded-full px-2 py-0.5 text-xs ${rec.status === "present" ? "bg-green-100 text-green-800" : rec.status === "absent" ? "bg-red-100 text-red-800" : rec.status === "late" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}
										>
											{rec.status}
										</span>
									</TableCell>
									<TableCell className="flex flex-row gap-2">
										<Button
											variant="outline"
											size="xs"
											onClick={() => alert(`View attendance ${rec.id}`)}
										>
											<CalendarCheckIcon className="mr-1 h-3 w-3" /> View
										</Button>
										<Button
											variant="outline"
											size="xs"
											onClick={() => alert(`Edit attendance ${rec.id}`)}
										>
											<ActivityIcon className="mr-1 h-3 w-3" /> Edit
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</PageTransition>
	);
}
