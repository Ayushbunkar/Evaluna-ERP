import { describe, expect, it } from "bun:test";
import { DOCS_GUIDES } from "../docs-guides-data";

describe("User Guides & Manuals (SOP & Ethics)", () => {
	const expectedGuideIds = [
		"sales-guide",
		"finance-guide",
		"operations-guide",
		"hr-guide",
		"keyboard-shortcuts",
		"common-workflows",
		"error-codes",
		"data-entry",
	];

	it("should have all 8 mandatory guides defined", () => {
		for (const id of expectedGuideIds) {
			expect(DOCS_GUIDES[id]).toBeDefined();
			expect(DOCS_GUIDES[id].id).toBe(id);
		}
	});

	it("should provide full bilingual English and Hindi metadata for every guide", () => {
		for (const [id, guide] of Object.entries(DOCS_GUIDES)) {
			// Titles & Subtitles
			expect(guide.title.en.length).toBeGreaterThan(10);
			expect(guide.title.hi.length).toBeGreaterThan(10);
			expect(guide.subtitle.en.length).toBeGreaterThan(15);
			expect(guide.subtitle.hi.length).toBeGreaterThan(15);

			// Summary
			expect(guide.summary.en.length).toBeGreaterThan(30);
			expect(guide.summary.hi.length).toBeGreaterThan(30);

			// Badges
			expect(guide.badge.en).toBeDefined();
			expect(guide.badge.hi).toBeDefined();

			// Ethics Highlights
			expect(guide.ethicsHighlights.en.length).toBeGreaterThanOrEqual(3);
			expect(guide.ethicsHighlights.hi.length).toBeGreaterThanOrEqual(3);
			for (const item of guide.ethicsHighlights.en) {
				expect(item.length).toBeGreaterThan(5);
			}
			for (const item of guide.ethicsHighlights.hi) {
				expect(item.length).toBeGreaterThan(5);
			}

			// Responsibilities / Boundaries
			expect(guide.responsibilities.en.length).toBeGreaterThanOrEqual(3);
			expect(guide.responsibilities.hi.length).toBeGreaterThanOrEqual(3);
			for (const resp of guide.responsibilities.en) {
				expect(resp.area).toBeDefined();
				expect(resp.standard).toBeDefined();
				expect(resp.rule).toBeDefined();
			}
			for (const resp of guide.responsibilities.hi) {
				expect(resp.area).toBeDefined();
				expect(resp.standard).toBeDefined();
				expect(resp.rule).toBeDefined();
			}

			// SOP steps
			expect(guide.sopSteps.en.length).toBeGreaterThanOrEqual(3);
			expect(guide.sopSteps.hi.length).toBeGreaterThanOrEqual(3);
			for (const step of guide.sopSteps.en) {
				expect(step.step).toBeDefined();
				expect(step.action).toBeDefined();
				expect(step.compliance).toBeDefined();
			}

			// Security Directives
			expect(guide.securityDirectives.en.length).toBeGreaterThanOrEqual(2);
			expect(guide.securityDirectives.hi.length).toBeGreaterThanOrEqual(2);
		}
	});

	it("should safeguard internal infrastructure secrets and maintain high-level public ethics", () => {
		const forbiddenSecrets = [
			"POSTGRES_PASSWORD",
			"DATABASE_URL",
			"BETTER_AUTH_SECRET",
			"private_key",
			"aws_secret",
			"jwt_secret",
			"sudo password",
		];

		const serializedData = JSON.stringify(DOCS_GUIDES);
		for (const secret of forbiddenSecrets) {
			expect(serializedData.toLowerCase()).not.toContain(secret.toLowerCase());
		}
	});

	it("should properly categorize Department Guides and Quick Reference guides", () => {
		const departmentIds = [
			"sales-guide",
			"finance-guide",
			"operations-guide",
			"hr-guide",
		];
		const quickReferenceIds = [
			"keyboard-shortcuts",
			"common-workflows",
			"error-codes",
			"data-entry",
		];

		for (const id of departmentIds) {
			expect(DOCS_GUIDES[id].category).toBe("department");
		}
		for (const id of quickReferenceIds) {
			expect(DOCS_GUIDES[id].category).toBe("quick-reference");
		}
	});

	it("should build vector PDF documents in English and Hindi without runtime errors", async () => {
		const { buildGuidePdfDoc } = await import("../utils/guide-pdf-generator");
		const salesGuide = DOCS_GUIDES["sales-guide"];

		// Test English doc build
		const enDoc = await buildGuidePdfDoc(salesGuide, "en");
		expect(enDoc).toBeDefined();
		expect(enDoc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
		const enBuffer = enDoc.output("arraybuffer");
		expect(enBuffer.byteLength).toBeGreaterThan(1000);

		// Test Hindi doc build
		const hiDoc = await buildGuidePdfDoc(salesGuide, "hi");
		expect(hiDoc).toBeDefined();
		expect(hiDoc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
		const hiBuffer = hiDoc.output("arraybuffer");
		expect(hiBuffer.byteLength).toBeGreaterThan(1000);
	});
});
