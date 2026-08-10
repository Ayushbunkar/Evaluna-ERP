"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@evaluna/ui/components/dialog";
import { FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

export function ImportModal({ onSuccess }: { onSuccess: () => void }) {
	const [open, setOpen] = useState(false);
	const [isImporting, setIsImporting] = useState(false);

	const importBulk = trpc.products.importBulk.useMutation({
		onSuccess: () => {
			setOpen(false);
			setIsImporting(false);
			onSuccess();
		},
	});

	// Handle file upload - parse CSV/Excel file
	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || e.target.files.length === 0) return;

		setIsImporting(true);

		// Parse the CSV/Excel file here using papaparse or xlsx
		// This is production code - no mock data
		// TODO: Implement actual file parsing logic
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" className="shadow-sm">
					<FileSpreadsheet className="mr-2 h-4 w-4" /> Import Data
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Import Products</DialogTitle>
				</DialogHeader>

				<div className="my-4 flex flex-col items-center justify-center rounded-xl border-2 border-gray-200 border-dashed bg-gray-50 p-6 text-center dark:border-gray-800 dark:bg-gray-900/50">
					{isImporting ? (
						<div className="flex flex-col items-center space-y-4 py-8">
							<Loader2 className="h-8 w-8 animate-spin text-primary" />
							<p className="text-gray-500 text-sm">
								Parsing and importing products...
							</p>
						</div>
					) : (
						<div className="flex flex-col items-center">
							<div className="mb-4 rounded-full bg-primary/10 p-4">
								<UploadCloud className="h-8 w-8 text-primary" />
							</div>
							<h3 className="mb-1 font-medium text-gray-900 dark:text-gray-100">
								Click or drag file to this area to upload
							</h3>
							<p className="mb-4 text-gray-500 text-xs">
								Support for a single or bulk upload. Strictly prohibit from
								uploading company data or other band files.
							</p>

							<div className="relative">
								<input
									type="file"
									className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
									accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
									onChange={handleFileUpload}
								/>
								<Button>Select File (.csv, .xlsx)</Button>
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
