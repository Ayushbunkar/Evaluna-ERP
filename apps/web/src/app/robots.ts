import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
	const siteUrl = getSiteUrl();

	return {
		rules: [
			{
				userAgent: "*",
				allow: [
					"/",
					"/about",
					"/features",
					"/product",
					"/solutions",
					"/pricing",
					"/demo",
					"/careers",
					"/contact",
					"/blog",
					"/resources",
					"/resources/*",
					"/docs",
					"/privacy",
					"/terms",
					"/status",
				],
				disallow: [
					"/api/",
					"/admin/",
					"/manager/",
					"/sales/",
					"/warehouse/",
					"/procurement/",
					"/finance/",
					"/hr/",
					"/picker/",
					"/packer/",
					"/putter/",
					"/loader/",
					"/driver/",
					"/supplier/",
					"/customer/",
					"/biller/",
					"/auditor/",
					"/route-manager/",
					"/superadmin/",
					"/test-responsive",
					"/login",
					"/signup",
					"/error",
					"/maintenance",
				],
			},
		],
		sitemap: `${siteUrl}/sitemap.xml`,
		host: siteUrl,
	};
}
