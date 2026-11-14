/**
 * Quantity Slab Pricing Engine for Evaluna ERP
 * Centralized business logic for Volume / Tiered Pricing across
 * Warehouse, Sales POS, and Customer Dashboards.
 */

export interface PricingSlab {
	id?: number;
	productId: number;
	minQuantity: number;
	maxQuantity: number | null; // null represents unlimited / onwards (e.g. 8+)
	unitPrice: number;
	startDate?: string | null; // YYYY-MM-DD
	endDate?: string | null; // YYYY-MM-DD (valid until date)
	isActive?: boolean;
}

export interface EffectivePriceResult {
	unitPrice: number;
	regularPrice: number;
	appliedSlab: PricingSlab | null;
	isSlabApplied: boolean;
	discountPercent: number;
	savingsPerUnit: number;
	totalPrice: number;
}

/**
 * Checks whether a slab is currently active and within its date validity window.
 */
export function isSlabValidForDate(
	slab: PricingSlab,
	targetDateStr?: string | Date,
): boolean {
	if (slab.isActive === false) return false;

	const dateStr =
		typeof targetDateStr === "string"
			? targetDateStr.split("T")[0]
			: targetDateStr instanceof Date
				? targetDateStr.toISOString().split("T")[0]
				: new Date().toISOString().split("T")[0];

	if (slab.startDate && dateStr < slab.startDate) {
		return false;
	}

	if (slab.endDate && dateStr > slab.endDate) {
		return false;
	}

	return true;
}

/**
 * Checks whether a requested quantity falls into a specific slab.
 * Respects tier transitions so that decimal quantities (e.g. 3.9 or 7.5) stay
 * in their respective tier (1-3 and 4-7) until the exact start of the next tier (4 or 8).
 */
export function isQuantityInSlab(
	slab: PricingSlab,
	allSlabs: PricingSlab[] | undefined | null,
	quantity: number,
	targetDate?: string | Date,
): boolean {
	const qty = Number(quantity);
	if (isNaN(qty) || qty <= 0) return false;

	const min = Number(slab.minQuantity);
	if (qty < min) return false;

	// Active slabs sorted by minQuantity ASC
	const activeSlabs = (allSlabs || [])
		.filter((s) => isSlabValidForDate(s, targetDate))
		.sort((a, b) => Number(a.minQuantity) - Number(b.minQuantity));

	const currentIndex = activeSlabs.findIndex(
		(s) =>
			Number(s.minQuantity) === min &&
			(s.id !== undefined && slab.id !== undefined
				? s.id === slab.id
				: Number(s.unitPrice) === Number(slab.unitPrice)),
	);

	const nextSlab =
		currentIndex >= 0 && currentIndex < activeSlabs.length - 1
			? activeSlabs[currentIndex + 1]
			: null;

	if (nextSlab) {
		const nextMin = Number(nextSlab.minQuantity);
		// Decimal quantities before the next tier starts belong to this tier:
		// e.g. 3.9 < 4 (stays in 1-3 slab), 7.5 < 8 (stays in 4-7 slab)
		return qty < nextMin;
	}

	// For the last tier or single tier
	const max =
		slab.maxQuantity !== null && slab.maxQuantity !== undefined
			? Number(slab.maxQuantity)
			: null;

	if (max === null) {
		return true; // Unlimited onwards (e.g. 8+)
	}

	if (Number.isInteger(max)) {
		return qty < max + 1;
	}

	return qty <= max;
}

/**
 * Finds the applicable slab for a specific line quantity and date.
 * Decimal quantities (e.g. 3.9 or 7.5) stay in their respective tier (1-3 and 4-7)
 * until reaching the exact start of the subsequent tier (4 or 8).
 */
export function findMatchingSlab(
	slabs: PricingSlab[] | undefined | null,
	quantity: number,
	targetDate?: string | Date,
): PricingSlab | null {
	if (!slabs || slabs.length === 0 || quantity <= 0) {
		return null;
	}

	// Filter only active & valid slabs for the date
	const activeSlabs = slabs.filter((s) => isSlabValidForDate(s, targetDate));
	if (activeSlabs.length === 0) {
		return null;
	}

	// Sort slabs by minQuantity ASC
	const sorted = [...activeSlabs].sort((a, b) => Number(a.minQuantity) - Number(b.minQuantity));

	for (let i = 0; i < sorted.length; i++) {
		const slab = sorted[i];
		const min = Number(slab.minQuantity);
		if (quantity < min) continue;

		const nextSlab = i < sorted.length - 1 ? sorted[i + 1] : null;
		if (nextSlab) {
			const nextMin = Number(nextSlab.minQuantity);
			if (quantity < nextMin) {
				return slab;
			}
		} else {
			// Last slab
			const max =
				slab.maxQuantity !== null && slab.maxQuantity !== undefined
					? Number(slab.maxQuantity)
					: null;
			if (max === null) {
				return slab;
			}
			if (Number.isInteger(max) ? quantity < max + 1 : quantity <= max) {
				return slab;
			}
		}
	}

	return null;
}

/**
 * Calculates effective unit price and savings for a product given a requested quantity.
 */
export function calculateEffectivePrice(params: {
	regularPrice: number;
	slabs?: PricingSlab[] | null;
	quantity: number;
	targetDate?: string | Date;
}): EffectivePriceResult {
	const { regularPrice, slabs, quantity, targetDate } = params;
	const safeRegularPrice = Math.max(0, Number(regularPrice) || 0);
	const safeQty = Math.max(0, Number(quantity) || 0);

	const matchingSlab = findMatchingSlab(slabs, safeQty, targetDate);

	if (matchingSlab && matchingSlab.unitPrice > 0) {
		const unitPrice = Number(Number(matchingSlab.unitPrice).toFixed(2));
		const savingsPerUnit = Math.max(0, Number((safeRegularPrice - unitPrice).toFixed(2)));
		const discountPercent =
			safeRegularPrice > 0
				? Number((((safeRegularPrice - unitPrice) / safeRegularPrice) * 100).toFixed(1))
				: 0;
		const totalPrice = Number((unitPrice * safeQty).toFixed(2));

		return {
			unitPrice,
			regularPrice: safeRegularPrice,
			appliedSlab: matchingSlab,
			isSlabApplied: true,
			discountPercent,
			savingsPerUnit,
			totalPrice,
		};
	}

	const unitPrice = Number(safeRegularPrice.toFixed(2));
	const totalPrice = Number((unitPrice * safeQty).toFixed(2));

	return {
		unitPrice,
		regularPrice: safeRegularPrice,
		appliedSlab: null,
		isSlabApplied: false,
		discountPercent: 0,
		savingsPerUnit: 0,
		totalPrice,
	};
}

/**
 * Validates quantity slab list for non-overlapping ranges and sensible boundaries.
 */
export function validateSlabs(
	slabs: Array<{
		minQuantity: number;
		maxQuantity: number | null;
		unitPrice: number;
	}>,
): { valid: boolean; error?: string; isValid: boolean; errors: string[] } {
	if (slabs.length === 0) {
		return { valid: true, isValid: true, errors: [] };
	}

	for (let i = 0; i < slabs.length; i++) {
		const s = slabs[i];
		if (s.minQuantity <= 0) {
			const err = `Slab #${i + 1}: Minimum quantity must be greater than 0.`;
			return { valid: false, isValid: false, error: err, errors: [err] };
		}
		if (s.unitPrice <= 0) {
			const err = `Slab #${i + 1}: Price per unit must be greater than 0.`;
			return { valid: false, isValid: false, error: err, errors: [err] };
		}
		if (s.maxQuantity !== null && s.maxQuantity <= s.minQuantity) {
			const err = `Slab #${i + 1}: Maximum quantity (${s.maxQuantity}) must be greater than minimum quantity (${s.minQuantity}).`;
			return {
				valid: false,
				isValid: false,
				error: err,
				errors: [err],
			};
		}
	}

	// Sort by minQuantity
	const sorted = [...slabs].sort((a, b) => a.minQuantity - b.minQuantity);

	for (let i = 0; i < sorted.length - 1; i++) {
		const curr = sorted[i];
		const next = sorted[i + 1];

		if (curr.maxQuantity === null) {
			const err = `Slab from ${curr.minQuantity} has no upper limit, so cannot have subsequent slab starting at ${next.minQuantity}.`;
			return {
				valid: false,
				isValid: false,
				error: err,
				errors: [err],
			};
		}

		if (curr.maxQuantity >= next.minQuantity) {
			const err = `Overlapping slabs detected: Slab (${curr.minQuantity} - ${curr.maxQuantity}) overlaps with next slab starting at ${next.minQuantity}.`;
			return {
				valid: false,
				isValid: false,
				error: err,
				errors: [err],
			};
		}
	}

	return { valid: true, isValid: true, errors: [] };
}

export interface OfferCountdownResult {
	isExpired: boolean;
	daysLeft: number;
	hoursLeft: number;
	badgeText: string;
	urgency: "urgent" | "warning" | "normal";
	formattedDate: string;
}

/**
 * Calculates countdown / urgency details for an offer or quantity slab with an end date.
 */
export function getOfferCountdown(
	endDateStr?: string | null,
	locale: string = "en",
): OfferCountdownResult | null {
	if (!endDateStr) return null;
	const trimmed = String(endDateStr).trim();
	if (!trimmed) return null;

	const parts = trimmed.split("T")[0].split("-");
	let endTimestamp: number;
	if (parts.length === 3) {
		const year = Number.parseInt(parts[0], 10);
		const month = Number.parseInt(parts[1], 10) - 1;
		const day = Number.parseInt(parts[2], 10);
		endTimestamp = new Date(year, month, day, 23, 59, 59, 999).getTime();
	} else {
		endTimestamp = new Date(trimmed).getTime();
	}

	if (Number.isNaN(endTimestamp)) return null;

	const now = Date.now();
	const diffMs = endTimestamp - now;

	// Format display date: DD/MM/YYYY
	let formattedDate = trimmed.split("T")[0];
	if (parts.length === 3) {
		formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
	}

	if (diffMs <= 0) {
		return {
			isExpired: true,
			daysLeft: 0,
			hoursLeft: 0,
			badgeText: locale === "hi" ? "⏳ आज अंतिम दिन!" : "⏳ Ends today!",
			urgency: "urgent",
			formattedDate,
		};
	}

	const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
	const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

	if (diffDays <= 1) {
		return {
			isExpired: false,
			daysLeft: 1,
			hoursLeft: diffHours,
			badgeText: locale === "hi" ? "⏳ आज अंतिम दिन!" : "⏳ Ends today!",
			urgency: "urgent",
			formattedDate,
		};
	}

	if (diffDays <= 3) {
		return {
			isExpired: false,
			daysLeft: diffDays,
			hoursLeft: diffHours,
			badgeText: locale === "hi" ? `⏳ केवल ${diffDays} दिन शेष!` : `⏳ Only ${diffDays} days left!`,
			urgency: "urgent",
			formattedDate,
		};
	}

	if (diffDays <= 7) {
		return {
			isExpired: false,
			daysLeft: diffDays,
			hoursLeft: diffHours,
			badgeText: locale === "hi" ? `⏳ ${diffDays} दिन शेष` : `⏳ ${diffDays} days left`,
			urgency: "warning",
			formattedDate,
		};
	}

	return {
		isExpired: false,
		daysLeft: diffDays,
		hoursLeft: diffHours,
		badgeText: locale === "hi" ? `⏳ ${diffDays} दिन शेष` : `⏳ ${diffDays} days left`,
		urgency: "normal",
		formattedDate,
	};
}

