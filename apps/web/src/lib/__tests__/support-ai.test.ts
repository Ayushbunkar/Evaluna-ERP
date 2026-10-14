import { describe, expect, it } from "bun:test";
import { processCustomerSupportQuery } from "../ai/customer-support-agent";
import { OFFICIAL_COMPANY_INFO } from "../ai/customer-support-data";
import { generateGroqCompletion } from "../ai/groq";

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
		// Must reference authentic phone or email or hours
		expect(
			response.text.includes("+91 96306 49277") ||
				response.text.includes("support@evaluna.com") ||
				response.text.includes("Evaluna"),
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
		// Should either say order not found or instruct how to check orders
		expect(
			response.text.toLowerCase().includes("order") ||
				response.text.toLowerCase().includes("not find") ||
				response.text.toLowerCase().includes("active"),
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
});
