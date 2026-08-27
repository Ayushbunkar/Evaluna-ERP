import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import TRPCProvider from "@/app/_trpc/provider";
import { CookieConsent } from "@/components/cookie-consent";
import { SmoothScrollProvider } from "@/components/SmoothScrollProvider";
import "./public-globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Evalona - Rural Business Infrastructure",
	description:
		"Modern technology built for the businesses that keep local communities moving",
	openGraph: {
		title: "Evalona - Rural Business Infrastructure",
		description:
			"Modern technology built for the businesses that keep local communities moving",
		images: [
			{
				url: "/api/og",
				width: 1200,
				height: 630,
				alt: "Evalona - Rural Business Infrastructure",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Evalona - Rural Business Infrastructure",
		description:
			"Modern technology built for the businesses that keep local communities moving",
		images: ["/api/og"],
	},
};

export default async function PublicLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const locale = await getLocale();
	const messages = await getMessages();

	return (
		<html lang={locale} suppressHydrationWarning>
			<head>
				<link rel="manifest" href="/manifest.json" />
				<meta name="theme-color" content="#000000" />
			</head>
			<body className={inter.className} suppressHydrationWarning>
				<NextIntlClientProvider locale={locale} messages={messages}>
					<TRPCProvider>
						<SmoothScrollProvider>
							<main className="public-website">{children}</main>
							<Toaster richColors position="bottom-right" />
							<CookieConsent />
						</SmoothScrollProvider>
					</TRPCProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}

