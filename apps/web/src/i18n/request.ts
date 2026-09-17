import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, type Locale, locales } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
	let locale: Locale = defaultLocale;

	try {
		const reqLocale = await requestLocale;
		if (reqLocale && locales.includes(reqLocale as Locale)) {
			locale = reqLocale as Locale;
		} else {
			const cookieStore = await cookies();
			const cookieLocale = cookieStore.get("locale")?.value;
			if (cookieLocale && locales.includes(cookieLocale as Locale)) {
				locale = cookieLocale as Locale;
			}
		}
	} catch {
		locale = defaultLocale;
	}

	let messages: any;
	try {
		if (locale === "hi") {
			messages = (await import("../messages/hi")).default;
		} else {
			messages = (await import("../messages/en")).default;
		}
	} catch {
		messages = (await import("../messages/en")).default;
	}

	return {
		locale,
		messages,
	};
});
