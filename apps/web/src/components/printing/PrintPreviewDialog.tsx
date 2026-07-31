"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@evaluna/ui/components/dialog";
import { Printer } from "lucide-react";
import { type ReactNode, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { isElectron } from "@/lib/electron";

interface PrintPreviewDialogProps {
	title?: string;
	trigger?: ReactNode;
	children: ReactNode;
	onBeforePrint?: () => Promise<void> | void;
	onAfterPrint?: () => void;
}

export function PrintPreviewDialog({
	title = "Print Preview",
	trigger,
	children,
	onBeforePrint,
	onAfterPrint,
}: PrintPreviewDialogProps) {
	const contentRef = useRef<HTMLDivElement>(null);

	const handlePrint = useReactToPrint({
		contentRef,
		onBeforePrint,
		onAfterPrint,
	});

	return (
		<Dialog>
			<DialogTrigger asChild>
				{trigger || (
					<Button variant="outline">
						<Printer className="mr-2 h-4 w-4" />
						Print
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>

				<div className="flex flex-1 justify-center overflow-auto rounded-md border bg-muted p-4">
					<div ref={contentRef} className="print-wrapper bg-white text-black">
						{children}
					</div>
				</div>

				<div className="mt-4 flex items-center justify-between">
					<div>
						{isElectron() && (
							<span className="rounded-md border border-green-200 bg-green-100 px-2 py-1 font-medium text-green-600 text-sm">
								Native Print Enabled
							</span>
						)}
					</div>
					<Button onClick={() => handlePrint()}>
						<Printer className="mr-2 h-4 w-4" />
						Confirm Print
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
