import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import TRPCProvider from "@/app/_trpc/provider";
import { CookieConsent } from "@/components/cookie-consent";
import { SmoothScrollProvider } from "@/components/SmoothScrollProvider";
import enMessages from "@/messages/en";
import hiMessages from "@/messages/hi";
import { defaultLocale, type Locale } from "@/i18n/config";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoDevanagari = Noto_Sans_Devanagari({
	subsets: ["devanagari"],
	variable: "--font-devanagari",
	weight: ["400", "500", "600", "700"],
});

const fallbackMessages: Record<Locale, any> = {
	en: enMessages,
	hi: hiMessages,
};

export const metadata: Metadata = {
	title: "Evaluna ERP",
	description: "Open-source point of sale system",
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	let locale: Locale = defaultLocale;
	let messages: any = enMessages;

	try {
		const resolvedLocale = await getLocale();
		if (resolvedLocale === "hi" || resolvedLocale === "en") {
			locale = resolvedLocale as Locale;
		}
		messages = await getMessages();
	} catch {
		messages = fallbackMessages[locale] || enMessages;
	}

	if (!messages || Object.keys(messages).length === 0) {
		messages = fallbackMessages[locale] || enMessages;
	}

	return (
		<html lang={locale} suppressHydrationWarning>
			<head>
				<link rel="manifest" href="/manifest.json" />
				<meta name="theme-color" content="#000000" />
			</head>
			<body
				className={`${inter.className} ${notoDevanagari.variable} ${inter.variable}`}
				suppressHydrationWarning
			>
				<NextIntlClientProvider locale={locale} messages={messages}>
					<TRPCProvider>
						<SmoothScrollProvider>
							<main>{children}</main>
							<Toaster richColors position="top-right" />
							<CookieConsent />
						</SmoothScrollProvider>
					</TRPCProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
