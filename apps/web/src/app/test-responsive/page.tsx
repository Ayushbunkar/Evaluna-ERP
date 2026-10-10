import type { Metadata } from "next";
import { ResponsiveTest } from "@/lib/responsive-test";

export const metadata: Metadata = {
	title: "Responsive Test",
	robots: { index: false, follow: false },
};

export default function ResponsiveTestPage() {
	return (
		<div className="min-h-screen bg-background">
			<ResponsiveTest />
		</div>
	);
}
