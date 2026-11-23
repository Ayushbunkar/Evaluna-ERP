import { describe, expect, it } from "bun:test";
import { parseEmailSender } from "../email";

describe("Email Parser & Brevo Configuration", () => {
	it("parses combined display name and email correctly", () => {
		const res = parseEmailSender("Evaluna <rahul.singh151893@gmail.com>");
		expect(res.name).toBe("Evaluna");
		expect(res.email).toBe("rahul.singh151893@gmail.com");
	});

	it("parses quoted display name and email correctly", () => {
		const res = parseEmailSender('"Evaluna ERP" <rahul.singh151893@gmail.com>');
		expect(res.name).toBe("Evaluna ERP");
		expect(res.email).toBe("rahul.singh151893@gmail.com");
	});

	it("parses plain email address and uses fallback name", () => {
		const res = parseEmailSender("rahul.singh151893@gmail.com");
		expect(res.name).toBe("Evaluna");
		expect(res.email).toBe("rahul.singh151893@gmail.com");
	});

	it("falls back to default verified sender when empty", () => {
		const res = parseEmailSender("");
		expect(res.name).toBe("Evaluna");
		expect(res.email).toBe("rahul.singh151893@gmail.com");
	});
});
