import { describe, expect, it } from "bun:test";
import { processCustomerSupportQuery } from "../ai/customer-support-agent";
import { OFFICIAL_COMPANY_INFO } from "../ai/customer-support-data";

describe("Customer Support AI - Grounded Agent & Configuration", () => {
	it("should have verified official company contact information", () => {
		expect(OFFICIAL_COMPANY_INFO.phone).toBe("+91 96306 49277");
		expect(OFFICIAL_COMPANY_INFO.email).toBe("support@evaluna.com");
		expect(OFFICIAL_COMPANY_INFO.operatingHours).toContain("Monday to Saturday");
		expect(OFFICIAL_COMPANY_INFO.phoneExtensions).toContain("1501");
	});

	it("should return official contact details for customer query", async () => {
		const response = await processCustomerSupportQuery({
			sessionId: 999,
			userUid: "test-user-123",
			userName: "Test Customer",
			content: "What is your official phone number and support email?",
			conversationHistory: [],
		});

		expect(response.text).toBeDefined();
		expect(response.text.length).toBeGreaterThan(10);
		expect(
			response.text.includes("+91 96306 49277") ||
				response.text.includes("support@evaluna.com") ||
				response.text.includes("Evaluna"),
		).toBe(true);
	});

	it("should guide payment inquiries to Payments tab and NOT show /finance slash route", async () => {
		const response = await processCustomerSupportQuery({
			sessionId: 999,
			userUid: "test-user-123",
			userName: "Test Customer",
			content: "Check my payment status and invoices",
			conversationHistory: [],
		});

		expect(response.text).toBeDefined();
		// Must NOT expose internal /finance URL
		expect(response.text.includes("/finance")).toBe(false);
		// Must direct to Payments tab or mention call/email support
		expect(
			response.text.toLowerCase().includes("payment") ||
				response.text.toLowerCase().includes("call") ||
				response.text.includes("+91 96306 49277"),
		).toBe(true);
	});

	it("should handle tracking query gracefully and without hallucinations", async () => {
		const response = await processCustomerSupportQuery({
			sessionId: 999,
			userUid: "non-existent-user-uid",
			userName: "Guest",
			content: "Where is my order #999999?",
			conversationHistory: [],
		});

		expect(response.text).toBeDefined();
		// Must NOT expose internal /sales/orders URL
		expect(response.text.includes("/sales/orders")).toBe(false);
		expect(
			response.text.toLowerCase().includes("order") ||
				response.text.toLowerCase().includes("not find") ||
				response.text.toLowerCase().includes("active") ||
				response.text.toLowerCase().includes("darj"),
		).toBe(true);
	});

	it("should detect human escalation requests", async () => {
		const response = await processCustomerSupportQuery({
			sessionId: 999,
			userUid: "test-user-123",
			content: "I want to talk to a human manager immediately",
			conversationHistory: [],
		});

		expect(response.escalated).toBe(true);
	});

	it("should correctly extract product search terms from natural language queries", async () => {
		const { extractProductSearchTerms } = await import(
			"../ai/customer-support-data"
		);

		const terms1 = extractProductSearchTerms("mujhe 20-20 biscuit ka rate batao");
		expect(terms1).toContain("20-20");
		expect(terms1).toContain("biscuit");

		const terms2 = extractProductSearchTerms("20 20 biscuit price");
		expect(terms2).toContain("20-20");
		expect(terms2).toContain("biscuit");

		const terms3 = extractProductSearchTerms("Sugar aur Atta ka rate kya hai?");
		expect(terms3).toContain("sugar");
		expect(terms3).toContain("atta");

		const termsConversational = extractProductSearchTerms("write a message in hinid");
		expect(termsConversational.length).toBe(0);
	});

	it("should NOT treat language requests or greetings as product rate lookups", async () => {
		const { isProductInquiry } = await import("../ai/customer-support-data");

		expect(isProductInquiry("write a message in hinid")).toBe(false);
		expect(isProductInquiry("write a message in hindi")).toBe(false);
		expect(isProductInquiry("hello how are you")).toBe(false);

		const response = await processCustomerSupportQuery({
			sessionId: 999,
			userUid: "test-user-123",
			userName: "Test Customer",
			content: "write a message in hinid",
			conversationHistory: [],
		});

		expect(response.text).toBeDefined();
		expect(response.text.toLowerCase().includes("ajwain")).toBe(false);
		expect(response.text.toLowerCase().includes("amina")).toBe(false);
		expect(response.text.toLowerCase().includes("baking soda")).toBe(false);
	});

	it("should return actual product rates when user asks for product pricing", async () => {
		const response = await processCustomerSupportQuery({
			sessionId: 999,
			userUid: "test-user-123",
			userName: "Test Customer",
			content: "mujhe 20-20 biscuit ka rate batao",
			conversationHistory: [],
		});

		expect(response.text).toBeDefined();
		expect(response.text.includes("20-20") || response.text.includes("20‑20")).toBe(true);
		expect(response.text.includes("55") || response.text.includes("54.50") || response.text.includes("650")).toBe(true);
		expect(response.text.includes("₹")).toBe(true);
	});
});
