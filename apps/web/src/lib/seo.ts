import type { Metadata } from "next";

/**
 * Evaluna ERP — Technical SEO Architecture & Metadata Engine
 *
 * Provides single source of truth for:
 * - Dynamic domain resolution
 * - Type-safe metadata construction
 * - Canonical URL enforcement
 * - Multilingual alternate tags
 * - Schema.org JSON-LD generation
 */

export function getSiteUrl(): string {
	const rawUrl =
		process.env.NEXT_PUBLIC_SITE_URL ||
		process.env.NEXT_PUBLIC_BASE_URL ||
		(process.env.VERCEL_PROJECT_PRODUCTION_URL
			? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
			: "") ||
		(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
		"https://evalunaerp.vercel.app";

	// Ensure protocol is present and remove trailing slash
	const withProtocol = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
	return withProtocol.replace(/\/$/, "");
}

export const siteConfig = {
	name: "Evaluna ERP",
	legalName: "Evaluna Technologies Pvt. Ltd.",
	shortName: "Evaluna",
	description:
		"Next-generation Enterprise Resource Planning and field operations platform built for retail chains, FMCG distribution, and warehouse logistics.",
	url: getSiteUrl(),
	ogImage: "/logo.png",
	themeColor: "#0f172a",
	locale: "en_IN",
	contact: {
		phone: "+91-9876543210",
		email: "support@evaluna-erp.com",
		address: "Bhopal Technology Park, Madhya Pradesh, India",
	},
	social: {
		twitter: "https://twitter.com/evalunaerp",
		linkedin: "https://linkedin.com/company/evalunaerp",
		github: "https://github.com/evalunaerp",
	},
	keywords: [
		"Evaluna ERP",
		"Enterprise Resource Planning India",
		"Retail POS Billing Software",
		"Offline POS System",
		"Warehouse Management System WMS",
		"FMCG Distribution Software",
		"Geofenced Staff Attendance",
		"GPS Field Sales App",
		"Barcode Inventory Management",
		"GST Invoicing Software",
		"Thermal Receipt Printing ERP",
		"Multi-branch Retail Operations",
	],
};

export interface ConstructMetadataParams {
	title: string;
	description?: string;
	canonicalPath?: string;
	noIndex?: boolean;
	keywords?: string[];
	ogType?: "website" | "article";
	publishedTime?: string;
	modifiedTime?: string;
	authors?: string[];
	image?: string;
}

export function constructMetadata({
	title,
	description = siteConfig.description,
	canonicalPath = "/",
	noIndex = false,
	keywords = siteConfig.keywords,
	ogType = "website",
	publishedTime,
	modifiedTime,
	authors,
	image = siteConfig.ogImage,
}: ConstructMetadataParams): Metadata {
	const siteUrl = getSiteUrl();
	// Normalize path to always start with / and have no trailing slash unless it's root
	const normalizedPath =
		canonicalPath === "/"
			? "/"
			: `/${canonicalPath.replace(/^\/+|\/+$/g, "")}`;
	const canonicalUrl = `${siteUrl}${normalizedPath}`;
	const ogImageUrl = image.startsWith("http") ? image : `${siteUrl}${image.startsWith("/") ? image : `/${image}`}`;

	const formattedTitle = title.includes("Evaluna")
		? title
		: `${title} | ${siteConfig.name}`;

	return {
		title: {
			default: formattedTitle,
			template: `%s | ${siteConfig.name}`,
		},
		description,
		keywords,
		metadataBase: new URL(siteUrl),
		alternates: {
			canonical: canonicalUrl,
			languages: {
				"en-IN": canonicalUrl,
				"hi-IN": `${canonicalUrl}?lang=hi`,
				"x-default": canonicalUrl,
			},
		},
		robots: noIndex
			? {
					index: false,
					follow: false,
					nocache: true,
					googleBot: {
						index: false,
						follow: false,
					},
				}
			: {
					index: true,
					follow: true,
					googleBot: {
						index: true,
						follow: true,
						"max-video-preview": -1,
						"max-image-preview": "large",
						"max-snippet": -1,
					},
				},
		openGraph: {
			type: ogType,
			title: formattedTitle,
			description,
			url: canonicalUrl,
			siteName: siteConfig.name,
			locale: siteConfig.locale,
			images: [
				{
					url: ogImageUrl,
					width: 1200,
					height: 630,
					alt: `${formattedTitle} — ${siteConfig.name}`,
				},
			],
			...(publishedTime ? { publishedTime } : {}),
			...(modifiedTime ? { modifiedTime } : {}),
			...(authors ? { authors } : {}),
		},
		twitter: {
			card: "summary_large_image",
			title: formattedTitle,
			description,
			images: [ogImageUrl],
			creator: "@evalunaerp",
		},
	};
}

// ── JSON-LD Structured Data Utilities ──────────────────────────────────────

export function generateOrganizationSchema() {
	const siteUrl = getSiteUrl();
	return {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: siteConfig.legalName,
		alternateName: siteConfig.name,
		url: siteUrl,
		logo: `${siteUrl}/logo.png`,
		description: siteConfig.description,
		contactPoint: {
			"@type": "ContactPoint",
			telephone: siteConfig.contact.phone,
			contactType: "customer service",
			areaServed: "IN",
			availableLanguage: ["English", "Hindi"],
		},
		address: {
			"@type": "PostalAddress",
			streetAddress: siteConfig.contact.address,
			addressCountry: "IN",
		},
		sameAs: [
			siteConfig.social.twitter,
			siteConfig.social.linkedin,
			siteConfig.social.github,
		],
	};
}

export function generateSoftwareApplicationSchema() {
	const siteUrl = getSiteUrl();
	return {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: siteConfig.name,
		applicationCategory: "BusinessApplication",
		operatingSystem: "Web, Android, iOS, Windows",
		url: siteUrl,
		offers: {
			"@type": "AggregateOffer",
			priceCurrency: "INR",
			lowPrice: "999",
			highPrice: "2499",
			offerCount: "3",
		},
		featureList: [
			"Offline Barcode POS Billing",
			"Warehouse Replenishment & Bin Allocation",
			"Field Sales Tracking & Route Optimization",
			"GPS Geofenced Biometric Attendance",
			"GST Invoicing & Real-time Profit/Loss Reports",
		],
	};
}

export function generateWebSiteSchema() {
	const siteUrl = getSiteUrl();
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: siteConfig.name,
		url: siteUrl,
		potentialAction: {
			"@type": "SearchAction",
			target: {
				"@type": "EntryPoint",
				urlTemplate: `${siteUrl}/resources?q={search_term_string}`,
			},
			"query-input": "required name=search_term_string",
		},
	};
}

export function generateBreadcrumbSchema(
	items: { name: string; url: string }[],
) {
	const siteUrl = getSiteUrl();
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: item.url.startsWith("http") ? item.url : `${siteUrl}${item.url}`,
		})),
	};
}

export function generateFaqSchema(faqs: { question: string; answer: string }[]) {
	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: faqs.map((faq) => ({
			"@type": "Question",
			name: faq.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: faq.answer,
			},
		})),
	};
}

export function generatePricingProductSchema() {
	const siteUrl = getSiteUrl();
	return {
		"@context": "https://schema.org",
		"@type": "Product",
		name: "Evaluna ERP Subscriptions",
		description:
			"Enterprise resource planning and operations software packages for retailers, distributors, and warehouses.",
		brand: {
			"@type": "Brand",
			name: siteConfig.name,
		},
		offers: [
			{
				"@type": "Offer",
				name: "Starter Plan",
				price: "999",
				priceCurrency: "INR",
				priceValidUntil: "2027-12-31",
				availability: "https://schema.org/InStock",
				url: `${siteUrl}/pricing`,
			},
			{
				"@type": "Offer",
				name: "Growth Plan",
				price: "2499",
				priceCurrency: "INR",
				priceValidUntil: "2027-12-31",
				availability: "https://schema.org/InStock",
				url: `${siteUrl}/pricing`,
			},
		],
	};
}
