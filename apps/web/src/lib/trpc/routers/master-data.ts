import { productCategories, taxRates } from "@evaluna/db/schema";
import { asc } from "drizzle-orm";
import { superadminProcedure, router } from "../init";

type Brand = {
	id: number;
	name: string;
	origin: string | null;
	status: string;
};

type Unit = {
	id: number;
	name: string;
	shortName: string | null;
	baseUnit: boolean;
};

export const masterDataRouter = router({
	getCategories: superadminProcedure.query(async ({ ctx }) => {
		const rows = await ctx.db
			.select({
				id: productCategories.id,
				name: productCategories.name,
				description: productCategories.description,
			})
			.from(productCategories)
			.orderBy(asc(productCategories.name));

		return rows.map((row) => ({
			id: row.id,
			name: row.name,
			description: row.description,
			status: "active",
		}));
	}),

	// No dedicated brands table yet — return an empty, correctly-typed set so
	// the UI renders its empty state instead of crashing.
	getBrands: superadminProcedure.query(async (): Promise<Brand[]> => {
		return [];
	}),

	// No dedicated units-of-measure table yet — same rationale as getBrands.
	getUnits: superadminProcedure.query(async (): Promise<Unit[]> => {
		return [];
	}),

	getTaxes: superadminProcedure.query(async ({ ctx }) => {
		const rows = await ctx.db
			.select({
				id: taxRates.id,
				name: taxRates.name,
				rate: taxRates.rate,
				type: taxRates.tax_type,
			})
			.from(taxRates)
			.orderBy(asc(taxRates.name));

		return rows;
	}),
});
