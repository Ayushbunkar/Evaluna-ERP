import { describe, expect, it } from "bun:test";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import {
	constructMetadata,
	generateBreadcrumbSchema,
	generateFaqSchema,
	generateOrganizationSchema,
	generatePricingProductSchema,
	generateSoftwareApplicationSchema,
	generateWebSiteSchema,
	getSiteUrl,
	siteConfig,
} from "@/lib/seo";

describe("Technical SEO Architecture & Validation", () => {
	describe("getSiteUrl() & siteConfig", () => {
		it("resolves a clean base URL without trailing slash", () => {
			const url = getSiteUrl();
			expect(url).toBeString();
			expect(url.startsWith("http://") || url.startsWith("https://")).toBeTrue();
			expect(url.endsWith("/")).toBeFalse();
		});

		it("contains comprehensive brand and organization metadata", () => {
			expect(siteConfig.name).toBe("Evaluna ERP");
			expect(siteConfig.legalName).toBe("Evaluna Technologies Pvt. Ltd.");
			expect(siteConfig.keywords.length).toBeGreaterThan(5);
			expect(siteConfig.contact.email).toContain("@");
			expect(siteConfig.contact.phone).toBeDefined();
		});
	});

	describe("constructMetadata()", () => {
		it("generates complete metadata object with canonical and alternates", () => {
			const meta = constructMetadata({
				title: "Enterprise Solutions",
				description: "Scalable retail and supply chain platform.",
				canonicalPath: "/solutions",
			});

			const siteUrl = getSiteUrl();
			expect(meta.description).toBe("Scalable retail and supply chain platform.");
			expect(meta.metadataBase?.toString()).toBe(`${siteUrl}/`);
			expect(meta.alternates?.canonical).toBe(`${siteUrl}/solutions`);
			expect(meta.alternates?.languages?.["en-IN"]).toBe(`${siteUrl}/solutions`);
			expect(meta.alternates?.languages?.["hi-IN"]).toBe(
				`${siteUrl}/solutions?lang=hi`,
			);
		});

		it("formats page title with brand template", () => {
			const meta = constructMetadata({
				title: "Warehouse WMS",
				canonicalPath: "/features",
			});

			// Title default should include brand
			const titleObj = meta.title as any;
			expect(titleObj.default).toContain("Warehouse WMS");
			expect(titleObj.default).toContain("Evaluna ERP");
		});

		it("attaches OpenGraph and Twitter cards with correct dimensions", () => {
			const meta = constructMetadata({
				title: "POS Billing",
				canonicalPath: "/product",
			});

			const og = meta.openGraph as any;
			expect(og.title).toContain("POS Billing");
			expect(og.siteName).toBe(siteConfig.name);
			expect(og.images?.[0]?.width).toBe(1200);
			expect(og.images?.[0]?.height).toBe(630);

			const twitter = meta.twitter as any;
			expect(twitter.card).toBe("summary_large_image");
			expect(twitter.title).toContain("POS Billing");
		});

		it("applies noindex directives when requested", () => {
			const meta = constructMetadata({
				title: "Private Dashboard",
				canonicalPath: "/admin",
				noIndex: true,
			});

			const robotsMeta = meta.robots as any;
			expect(robotsMeta.index).toBeFalse();
			expect(robotsMeta.follow).toBeFalse();
			expect(robotsMeta.googleBot.index).toBeFalse();
			expect(robotsMeta.googleBot.follow).toBeFalse();
		});

		it("normalizes canonical path correctly", () => {
			const meta = constructMetadata({
				title: "Test",
				canonicalPath: "///about///",
			});

			const siteUrl = getSiteUrl();
			expect(meta.alternates?.canonical).toBe(`${siteUrl}/about`);
		});
	});

	describe("Schema.org JSON-LD Generators", () => {
		it("generates valid Organization schema", () => {
			const schema = generateOrganizationSchema();
			expect(schema["@context"]).toBe("https://schema.org");
			expect(schema["@type"]).toBe("Organization");
			expect(schema.name).toBe(siteConfig.legalName);
			expect(schema.url).toBe(getSiteUrl());
			expect(schema.contactPoint["@type"]).toBe("ContactPoint");
			expect(schema.address["@type"]).toBe("PostalAddress");
			expect(Array.isArray(schema.sameAs)).toBeTrue();
		});

		it("generates valid SoftwareApplication schema", () => {
			const schema = generateSoftwareApplicationSchema();
			expect(schema["@context"]).toBe("https://schema.org");
			expect(schema["@type"]).toBe("SoftwareApplication");
			expect(schema.applicationCategory).toBe("BusinessApplication");
			expect(schema.offers["@type"]).toBe("AggregateOffer");
			expect(schema.offers.priceCurrency).toBe("INR");
			expect(schema.featureList.length).toBeGreaterThan(0);
		});

		it("generates valid WebSite schema with Sitelinks SearchAction", () => {
			const schema = generateWebSiteSchema();
			expect(schema["@context"]).toBe("https://schema.org");
			expect(schema["@type"]).toBe("WebSite");
			expect(schema.potentialAction["@type"]).toBe("SearchAction");
			expect(schema.potentialAction.target["@type"]).toBe("EntryPoint");
		});

		it("generates valid BreadcrumbList schema with 1-based indexing", () => {
			const items = [
				{ name: "Home", url: "/" },
				{ name: "Resources", url: "/resources" },
				{ name: "Guides", url: "/resources/guides" },
			];
			const schema = generateBreadcrumbSchema(items);
			expect(schema["@context"]).toBe("https://schema.org");
			expect(schema["@type"]).toBe("BreadcrumbList");
			expect(schema.itemListElement.length).toBe(3);
			expect(schema.itemListElement[0].position).toBe(1);
			expect(schema.itemListElement[1].position).toBe(2);
			expect(schema.itemListElement[2].position).toBe(3);
			expect(schema.itemListElement[2].name).toBe("Guides");
		});

		it("generates valid FAQPage schema", () => {
			const faqs = [
				{
					question: "Can I use Evaluna ERP offline?",
					answer: "Yes, offline-first POS keeps working locally.",
				},
				{
					question: "Does it support GST?",
					answer: "Yes, full CGST/SGST/IGST support.",
				},
			];
			const schema = generateFaqSchema(faqs);
			expect(schema["@context"]).toBe("https://schema.org");
			expect(schema["@type"]).toBe("FAQPage");
			expect(schema.mainEntity.length).toBe(2);
			expect(schema.mainEntity[0]["@type"]).toBe("Question");
			expect(schema.mainEntity[0].name).toBe("Can I use Evaluna ERP offline?");
			expect(schema.mainEntity[0].acceptedAnswer["@type"]).toBe("Answer");
		});

		it("generates valid Product and Offers schema for pricing", () => {
			const schema = generatePricingProductSchema();
			expect(schema["@context"]).toBe("https://schema.org");
			expect(schema["@type"]).toBe("Product");
			expect(schema.brand["@type"]).toBe("Brand");
			expect(schema.offers.length).toBeGreaterThanOrEqual(2);
			expect(schema.offers[0]["@type"]).toBe("Offer");
			expect(schema.offers[0].priceCurrency).toBe("INR");
		});
	});

	describe("XML Sitemap (apps/web/src/app/sitemap.ts)", () => {
		const sitemapEntries = sitemap();

		it("generates entries for all 18 indexable public routes", () => {
			expect(sitemapEntries.length).toBe(18);
		});

		it("every sitemap entry has a valid absolute URL, priority, and changeFrequency", () => {
			const siteUrl = getSiteUrl();
			for (const entry of sitemapEntries) {
				expect(entry.url.startsWith(siteUrl)).toBeTrue();
				expect(entry.priority).toBeGreaterThanOrEqual(0.1);
				expect(entry.priority).toBeLessThanOrEqual(1.0);
				expect(entry.changeFrequency).toBeDefined();
				expect(entry.lastModified).toBeDefined();
			}
		});

		it("contains no duplicate URLs in sitemap", () => {
			const urls = sitemapEntries.map((e) => e.url);
			const uniqueUrls = new Set(urls);
			expect(uniqueUrls.size).toBe(urls.length);
		});

		it("homepage has maximum priority 1.0", () => {
			const home = sitemapEntries.find((e) => e.url === `${getSiteUrl()}`);
			expect(home).toBeDefined();
			expect(home?.priority).toBe(1.0);
		});
	});

	describe("Robots.txt (apps/web/src/app/robots.ts)", () => {
		const robotsConfig = robots();

		it("has rules targeting userAgent '*'", () => {
			expect(robotsConfig.rules).toBeDefined();
			const rule = Array.isArray(robotsConfig.rules)
				? robotsConfig.rules[0]
				: robotsConfig.rules;
			expect(rule.userAgent).toBe("*");
		});

		it("explicitly allows public landing pages", () => {
			const rule = Array.isArray(robotsConfig.rules)
				? robotsConfig.rules[0]
				: robotsConfig.rules;
			const allowed = rule.allow as string[];
			expect(allowed).toContain("/");
			expect(allowed).toContain("/about");
			expect(allowed).toContain("/features");
			expect(allowed).toContain("/pricing");
			expect(allowed).toContain("/docs");
		});

		it("strictly disallows private dashboards and APIs", () => {
			const rule = Array.isArray(robotsConfig.rules)
				? robotsConfig.rules[0]
				: robotsConfig.rules;
			const disallowed = rule.disallow as string[];
			expect(disallowed).toContain("/api/");
			expect(disallowed).toContain("/admin/");
			expect(disallowed).toContain("/manager/");
			expect(disallowed).toContain("/sales/");
			expect(disallowed).toContain("/warehouse/");
			expect(disallowed).toContain("/procurement/");
			expect(disallowed).toContain("/finance/");
			expect(disallowed).toContain("/hr/");
			expect(disallowed).toContain("/login");
		});

		it("points to the correct absolute sitemap URL", () => {
			expect(robotsConfig.sitemap).toBe(`${getSiteUrl()}/sitemap.xml`);
		});
	});
});
