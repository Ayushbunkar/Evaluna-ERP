/**
 * Barcode validation utilities for UPC, EAN, and other formats
 */

/**
 * Validate UPC-A check digit
 * @param upc - 12-digit UPC-A code (string or number)
 * @returns true if valid, false otherwise
 */
export function validateUPCCheckDigit(upc: string | number): boolean {
	const upcStr = String(upc).padStart(12, "0");

	// Must be exactly 12 digits
	if (!/^\d{12}$/.test(upcStr)) {
		return false;
	}

	// Calculate check digit
	let sum = 0;
	for (let i = 0; i < 11; i++) {
		const digit = Number.parseInt(upcStr.charAt(i), 10);
		// Multiply odd-positioned digits (1,3,5,...) by 3, even-positioned by 1
		// Note: positions are 1-indexed from left
		sum += digit * (i % 2 === 0 ? 3 : 1);
	}

	const checkDigit = (10 - (sum % 10)) % 10;
	const actualCheckDigit = Number.parseInt(upcStr.charAt(11), 10);

	return checkDigit === actualCheckDigit;
}

/**
 * Validate EAN-13 check digit
 * @param ean - 13-digit EAN-13 code (string or number)
 * @returns true if valid, false otherwise
 */
export function validateEANCheckDigit(ean: string | number): boolean {
	const eanStr = String(ean).padStart(13, "0");

	// Must be exactly 13 digits
	if (!/^\d{13}$/.test(eanStr)) {
		return false;
	}

	// Calculate check digit
	let sum = 0;
	for (let i = 0; i < 12; i++) {
		const digit = Number.parseInt(eanStr.charAt(i), 10);
		// Multiply odd-positioned digits (from right, 1-indexed) by 3, even by 1
		// For EAN-13, we start from the right for the alternating multiplication
		const posFromRight = 12 - i;
		sum += digit * (posFromRight % 2 === 1 ? 3 : 1);
	}

	const checkDigit = (10 - (sum % 10)) % 10;
	const actualCheckDigit = Number.parseInt(eanStr.charAt(12), 10);

	return checkDigit === actualCheckDigit;
}

/**
 * Validate UPC-A or EAN-13 check digit based on length
 * @param code - UPC-A (12 digits) or EAN-13 (13 digits) code
 * @returns true if valid, false otherwise
 */
export function validateGTINCheckDigit(code: string | number): boolean {
	const codeStr = String(code);

	if (/^\d{12}$/.test(codeStr)) {
		return validateUPCCheckDigit(codeStr);
	}
	if (/^\d{13}$/.test(codeStr)) {
		return validateEANCheckDigit(codeStr);
	}

	return false;
}

/**
 * Generate check digit for UPC-A
 * @param upc - First 11 digits of UPC-A
 * @returns 12th digit (check digit)
 */
export function generateUPCCheckDigit(upc: string | number): number {
	const upcStr = String(upc).padStart(11, "0");

	if (!/^\d{11}$/.test(upcStr)) {
		throw new Error("UPC must be exactly 11 digits for check digit generation");
	}

	let sum = 0;
	for (let i = 0; i < 11; i++) {
		const digit = Number.parseInt(upcStr.charAt(i), 10);
		sum += digit * (i % 2 === 0 ? 3 : 1);
	}

	return (10 - (sum % 10)) % 10;
}

/**
 * Generate check digit for EAN-13
 * @param ean - First 12 digits of EAN-13
 * @returns 13th digit (check digit)
 */
export function generateEANCheckDigit(ean: string | number): number {
	const eanStr = String(ean).padStart(12, "0");

	if (!/^\d{12}$/.test(eanStr)) {
		throw new Error("EAN must be exactly 12 digits for check digit generation");
	}

	let sum = 0;
	for (let i = 0; i < 12; i++) {
		const digit = Number.parseInt(eanStr.charAt(i), 10);
		const posFromRight = 11 - i;
		sum += digit * (posFromRight % 2 === 1 ? 3 : 1);
	}

	return (10 - (sum % 10)) % 10;
}

/**
 * Format a barcode with proper check digit validation or generation
 * @param barcode - Barcode to format
 * @param type - Barcode type: 'UPC', 'EAN', or 'INTERNAL'
 * @returns Formatted barcode with valid check digit
 */
export function formatBarcode(
	barcode: string,
	type: "UPC" | "EAN" | "INTERNAL",
): string {
	// Remove any non-digit characters
	const cleanBarcode = barcode.replace(/\D/g, "");

	if (type === "UPC") {
		// UPC-A should be 12 digits
		if (cleanBarcode.length === 11) {
			// Generate check digit
			const checkDigit = generateUPCCheckDigit(cleanBarcode);
			return cleanBarcode + checkDigit;
		}
		if (cleanBarcode.length === 12) {
			// Validate existing check digit
			if (validateUPCCheckDigit(cleanBarcode)) {
				return cleanBarcode;
			}
			// If invalid, recalculate
			const base = cleanBarcode.slice(0, 11);
			const checkDigit = generateUPCCheckDigit(base);
			return base + checkDigit;
		}
		// Default: pad or truncate to 11 and generate check digit
		const base = cleanBarcode.slice(0, 11).padStart(11, "0");
		const checkDigit = generateUPCCheckDigit(base);
		return base + checkDigit;
	}
	if (type === "EAN") {
		// EAN-13 should be 13 digits
		if (cleanBarcode.length === 12) {
			// Generate check digit
			const checkDigit = generateEANCheckDigit(cleanBarcode);
			return cleanBarcode + checkDigit;
		}
		if (cleanBarcode.length === 13) {
			// Validate existing check digit
			if (validateEANCheckDigit(cleanBarcode)) {
				return cleanBarcode;
			}
			// If invalid, recalculate
			const base = cleanBarcode.slice(0, 12);
			const checkDigit = generateEANCheckDigit(base);
			return base + checkDigit;
		}
		// Default: pad or truncate to 12 and generate check digit
		const base = cleanBarcode.slice(0, 12).padStart(12, "0");
		const checkDigit = generateEANCheckDigit(base);
		return base + checkDigit;
	}
	// INTERNAL: no validation, just return as-is or pad to reasonable length
	return cleanBarcode || "000000";
}
