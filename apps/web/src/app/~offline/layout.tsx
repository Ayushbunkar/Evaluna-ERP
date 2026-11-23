import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Offline Mode",
	robots: {
		index: false,
		follow: false,
	},
};

export default function OfflineLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
