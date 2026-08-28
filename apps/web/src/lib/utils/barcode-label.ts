import JsBarcode from "jsbarcode";
import { jsPDF } from "jspdf";

/**
 * Generate a barcode label PDF for a product
 * @param product - Product data including id, name, barcode, optional sku and barcodeType
 * @returns PDF as ArrayBuffer
 */
export const generateBarcodeLabelPDF = async (product: {
	id: number;
	name: string;
	barcode: string;
	sku?: string;
	barcodeType?: "UPC" | "EAN" | "INTERNAL";
}): Promise<ArrayBuffer> => {
	// Determine jsbarcode format based on barcode type
	let format: Parameters<typeof JsBarcode>[1]["format"] = "CODE128";
	if (product.barcodeType === "UPC") {
		format = "UPC_A";
	} else if (product.barcodeType === "EAN") {
		format = "EAN";
	} else {
		// Default to CODE128 for INTERNAL or unknown
		format = "CODE128";
	}

	// Generate barcode SVG
	const svg = JsBarcode(product.barcode, {
		format,
		width: 2,
		height: 50,
		displayValue: true,
		fontOptions: "",
		font: "monaco",
		textAlign: "center",
		textPosition: "bottom",
		textMargin: 2,
		fontSize: 12,
		background: "#ffffff",
		lineColor: "#000000",
	});

	// Convert SVG to data URL
	const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString(
		"base64",
	)}`;

	// Create PDF - label size 50x25 mm (approx 2x1 inch)
	const doc = new jsPDF({
		unit: "mm",
		format: [50, 25],
	});

	// Add barcode image
	const imgProps = doc.getImageProperties(svgDataUrl);
	const pdfWidth = doc.internal.pageSize.getWidth();
	const pdfHeight = doc.internal.pageSize.getHeight();
	const imgWidth = 40; // mm
	const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
	const x = (pdfWidth - imgWidth) / 2;
	const y = 5; // top margin

	doc.addImage(svgDataUrl, "SVG", x, y, imgWidth, imgHeight);

	// Add product name
	doc.setFontSize(10);
	doc.text(product.name, pdfWidth / 2, y + imgHeight + 5, { align: "center" });

	// Add SKU if present
	if (product.sku) {
		doc.setFontSize(8);
		doc.text(`SKU: ${product.sku}`, pdfWidth / 2, y + imgHeight + 10, {
			align: "center",
		});
	}

	// Add barcode value
	doc.setFontSize(8);
	doc.text(product.barcode, pdfWidth / 2, y + imgHeight + 15, {
		align: "center",
	});

	// Return as ArrayBuffer
	const pdfArrayBuffer = doc.output("arraybuffer");
	return pdfArrayBuffer;
};
