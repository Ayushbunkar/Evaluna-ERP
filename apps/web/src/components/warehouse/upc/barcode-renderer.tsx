"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeRendererProps {
	value: string;
	format?: "UPC" | "CODE128" | "EAN13";
	width?: number;
	height?: number;
	fontSize?: number;
	className?: string;
}

export function BarcodeRenderer({
	value,
	format = "UPC",
	width = 2,
	height = 52,
	fontSize = 13,
	className = "",
}: BarcodeRendererProps) {
	const svgRef = useRef<SVGSVGElement | null>(null);

	useEffect(() => {
		if (svgRef.current && value && value.trim().length > 0) {
			try {
				// UPC-A in JsBarcode is "UPC" or "CODE128" fallback if not exactly 12 digits
				const targetFormat = format === "UPC" && /^\d{12}$/.test(value.trim()) ? "UPC" : "CODE128";
				JsBarcode(svgRef.current, value.trim(), {
					format: targetFormat,
					width,
					height,
					displayValue: true,
					font: "monospace",
					fontSize,
					textMargin: 4,
					margin: 6,
					background: "transparent",
					lineColor: "#0f172a",
				});
			} catch (e) {
				console.error("Barcode render error:", e);
			}
		}
	}, [value, format, width, height, fontSize]);

	if (!value || value.trim().length === 0) {
		return <span className="text-xs text-muted-foreground font-mono">No Barcode</span>;
	}

	return (
		<div className={`flex flex-col items-center justify-center overflow-hidden ${className}`}>
			<svg ref={svgRef} className="max-w-full h-auto" />
		</div>
	);
}
