import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
	const siteUrl = getSiteUrl();
	const currentDate = new Date().toISOString();

	const routes: {
		path: string;
		priority: number;
		changeFrequency:
			| "always"
			| "hourly"
			| "daily"
			| "weekly"
			| "monthly"
			| "yearly"
			| "never";
	}[] = [
		{ path: "", priority: 1.0, changeFrequency: "weekly" },
		{ path: "/features", priority: 0.9, changeFrequency: "weekly" },
		{ path: "/solutions", priority: 0.9, changeFrequency: "weekly" },
		{ path: "/pricing", priority: 0.9, changeFrequency: "weekly" },
		{ path: "/product", priority: 0.8, changeFrequency: "weekly" },
		{ path: "/demo", priority: 0.8, changeFrequency: "monthly" },
		{ path: "/about", priority: 0.7, changeFrequency: "monthly" },
		{ path: "/blog", priority: 0.8, changeFrequency: "daily" },
		{ path: "/resources", priority: 0.7, changeFrequency: "weekly" },
		{ path: "/resources/guides", priority: 0.7, changeFrequency: "weekly" },
		{ path: "/resources/updates", priority: 0.7, changeFrequency: "weekly" },
		{ path: "/resources/help", priority: 0.7, changeFrequency: "weekly" },
		{ path: "/docs", priority: 0.7, changeFrequency: "weekly" },
		{ path: "/careers", priority: 0.6, changeFrequency: "monthly" },
		{ path: "/contact", priority: 0.7, changeFrequency: "monthly" },
		{ path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
		{ path: "/terms", priority: 0.3, changeFrequency: "yearly" },
		{ path: "/status", priority: 0.5, changeFrequency: "daily" },
	];

	return routes.map((route) => ({
		url: `${siteUrl}${route.path}`,
		lastModified: currentDate,
		changeFrequency: route.changeFrequency,
		priority: route.priority,
	}));
}
