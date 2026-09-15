"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Download, Printer, QrCode } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { BarcodeRenderer } from "./barcode-renderer";

interface PrintUpcLabelProps {
	isOpen: boolean;
	onClose: () => void;
	product?: {
		id?: number;
		name: string;
		sku?: string | null;
		category?: string | null;
		price?: string | null;
		upc: string;
	} | null;
	productName?: string;
	sku?: string | null;
	upc?: string;
}

export function PrintUpcLabelModal({
	isOpen,
	onClose,
	product: propProduct,
	productName,
	sku,
	upc,
}: PrintUpcLabelProps) {
	const [copies, setCopies] = useState<number>(1);
	const printRef = useRef<HTMLDivElement>(null);

	const product = propProduct || (upc ? {
		name: productName || "Product",
		sku: sku || null,
		upc: upc,
	} : null);

	if (!product) return null;

	const handlePrint = () => {
		const printContent = printRef.current;
		if (!printContent) return;

		const printWindow = window.open("", "_blank");
		if (!printWindow) {
			toast.error("Please allow popups to print barcode labels.");
			return;
		}

		printWindow.document.write(`
			<!DOCTYPE html>
			<html>
				<head>
					<title>Print UPC Label - ${product.name}</title>
					<style>
						@page {
							size: 50mm 25mm;
							margin: 0;
						}
						body {
							margin: 0;
							padding: 2mm;
							font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
							color: #000;
							background: #fff;
							display: flex;
							flex-direction: column;
							align-items: center;
							justify-content: center;
							text-align: center;
							width: 46mm;
							height: 21mm;
							box-sizing: border-box;
						}
						.product-name {
							font-size: 8pt;
							font-weight: bold;
							white-space: nowrap;
							overflow: hidden;
							text-overflow: ellipsis;
							max-width: 44mm;
							margin-bottom: 1mm;
						}
						.sku-meta {
							font-size: 6pt;
							color: #333;
							margin-bottom: 1mm;
						}
						.barcode-wrap svg {
							max-width: 42mm;
							height: 12mm;
						}
						@media print {
							body {
								-webkit-print-color-adjust: exact;
								print-color-adjust: exact;
							}
						}
					</style>
				</head>
				<body>
					<div class="product-name">${product.name}</div>
					<div class="sku-meta">SKU: ${product.sku || "N/A"} | Price: ₹${product.price || "0"}</div>
					<div class="barcode-wrap">
						${printContent.querySelector("svg")?.outerHTML || `<div style="font-family:monospace;font-size:10pt;">${product.upc}</div>`}
					</div>
					<script>
						window.onload = function() {
							window.print();
							window.onafterprint = function() { window.close(); };
						};
					</script>
				</body>
			</html>
		`);
		printWindow.document.close();
		toast.success("Sent to thermal label printer.");
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
						<QrCode className="w-5 h-5 text-blue-600" />
						Print UPC Barcode Label
					</DialogTitle>
					<DialogDescription className="text-xs text-slate-500">
						Thermal label preview (50mm x 25mm / 2&quot; x 1&quot; standard sticker format).
					</DialogDescription>
				</DialogHeader>

				<div className="my-4 flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60">
					{/* Printable label card preview */}
					<div
						ref={printRef}
						className="w-56 p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center text-center text-slate-900 dark:text-slate-100"
					>
						<div className="font-bold text-xs truncate max-w-full mb-0.5">
							{product.name}
						</div>
						<div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mb-1">
							SKU: {product.sku || "N/A"} {product.price ? `| ₹${product.price}` : ""}
						</div>
						<div className="w-full flex justify-center py-1 bg-white rounded">
							<BarcodeRenderer value={product.upc} height={42} width={1.8} fontSize={11} />
						</div>
					</div>

					<div className="mt-4 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
						<span>Format: <strong className="text-slate-900 dark:text-slate-200">UPC-A (12 Digits)</strong></span>
						<span>•</span>
						<span>Status: <strong className="text-emerald-600">Active Verified</strong></span>
					</div>
				</div>

				<DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
					<Button variant="outline" size="sm" onClick={onClose}>
						Cancel
					</Button>
					<Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5" onClick={handlePrint}>
						<Printer className="w-4 h-4" /> Print Label
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { PrintUpcLabelModal as PrintUPCLabelModal };
