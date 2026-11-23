import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import "./public-globals.css";

export const metadata: Metadata = constructMetadata({
	title: "Rural Business Infrastructure Platform",
	description:
		"Modern enterprise resource planning built for rural businesses and distribution networks.",
	canonicalPath: "/public",
});

export default function PublicLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <div className="public-website">{children}</div>;
}
