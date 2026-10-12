import { jsPDF } from "jspdf";
import type { GuideContent } from "@/lib/docs-guides-data";

let cachedFontBase64: string | null = null;

async function getDevanagariFontBase64(): Promise<string | null> {
	if (cachedFontBase64) return cachedFontBase64;
	try {
		if (typeof window === "undefined") {
			const fs = await import("fs");
			const path = await import("path");
			const fontPath = path.resolve(
				process.cwd(),
				"apps/web/public/fonts/NotoSansDevanagari-Regular.ttf",
			);
			const fallbackPath = path.resolve(
				process.cwd(),
				"public/fonts/NotoSansDevanagari-Regular.ttf",
			);
			const targetPath = fs.existsSync(fontPath) ? fontPath : fallbackPath;
			if (fs.existsSync(targetPath)) {
				cachedFontBase64 = fs.readFileSync(targetPath).toString("base64");
				return cachedFontBase64;
			}
			return null;
		}

		const res = await fetch("/fonts/NotoSansDevanagari-Regular.ttf");
		if (!res.ok) {
			console.warn("Could not fetch NotoSansDevanagari font");
			return null;
		}
		const arrayBuf = await res.arrayBuffer();
		let binary = "";
		const bytes = new Uint8Array(arrayBuf);
		const len = bytes.byteLength;
		for (let i = 0; i < len; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		cachedFontBase64 = window.btoa(binary);
		return cachedFontBase64;
	} catch (e) {
		console.warn("Error loading Devanagari font:", e);
		return null;
	}
}

export async function buildGuidePdfDoc(
	guide: GuideContent,
	language: "en" | "hi",
): Promise<jsPDF> {
	const autoTableModule = await import("jspdf-autotable");
	const autoTable = autoTableModule.default;

	const doc = new jsPDF({
		orientation: "p",
		unit: "mm",
		format: "a4",
		compress: true,
	});

	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const isHindi = language === "hi";

	let activeFont = "helvetica";

	if (isHindi) {
		const fontBase64 = await getDevanagariFontBase64();
		if (fontBase64) {
			doc.addFileToVFS("NotoSansDevanagari.ttf", fontBase64);
			doc.addFont("NotoSansDevanagari.ttf", "NotoDevanagari", "normal");
			doc.addFont("NotoSansDevanagari.ttf", "NotoDevanagari", "bold");
			activeFont = "NotoDevanagari";
		}
	}

	doc.setFont(activeFont);

	// Palette tokens (Warm Executive Palette matching Evaluna design system)
	const colorHeaderBg = [25, 22, 19] as [number, number, number]; // #191613
	const colorAccent = [184, 121, 87] as [number, number, number]; // #B87957
	const colorWarmNeutral = [248, 245, 239] as [number, number, number]; // #F8F5EF
	const colorBorder = [222, 211, 197] as [number, number, number]; // #DED3C5
	const colorPrimaryText = [48, 39, 32] as [number, number, number]; // #302720
	const colorMutedText = [119, 106, 93] as [number, number, number]; // #776A5D

	// --- 1. Top Brand Banner ---
	doc.setFillColor(...colorHeaderBg);
	doc.rect(0, 0, pageWidth, 28, "F");

	// Accent bottom stripe on header
	doc.setFillColor(...colorAccent);
	doc.rect(0, 28, pageWidth, 2, "F");

	// Brand Wordmark
	doc.setTextColor(255, 255, 255);
	doc.setFontSize(14);
	doc.setFont(activeFont, "bold");
	doc.text(
		isHindi ? "इवालूना एंटरप्राइज सिस्टम्स" : "EVALUNA ENTERPRISE SYSTEMS",
		14,
		11,
	);

	// Subtitle & Regional Reference
	doc.setFontSize(8);
	doc.setFont(activeFont, "normal");
	doc.setTextColor(201, 145, 112); // #C99170
	doc.text(
		isHindi
			? "मानक संचालन प्रक्रिया (SOP) एवं आचार संहिता | भोपाल - बैरसिया हब"
			: "Official Standard Operating Procedures (SOP) & Ethics Charter | Bhopal - Berasia Hub",
		14,
		18,
	);

	doc.setTextColor(210, 200, 190);
	doc.setFontSize(7.5);
	const docRef = `REF: EVALUNA-SOP-${guide.id.toUpperCase()}-2026 | CLASSIFICATION: PUBLIC STANDARDS`;
	doc.text(docRef, 14, 24);

	// Date Stamp
	const dateStr = new Date().toLocaleDateString(
		isHindi ? "hi-IN" : "en-US",
		{
			year: "numeric",
			month: "short",
			day: "numeric",
		},
	);
	doc.text(dateStr, pageWidth - 14, 24, { align: "right" });

	let yPos = 36;

	// --- 2. Title Section ---
	doc.setFillColor(...colorWarmNeutral);
	doc.rect(14, yPos, pageWidth - 28, 18, "F");
	doc.setDrawColor(...colorBorder);
	doc.setLineWidth(0.3);
	doc.rect(14, yPos, pageWidth - 28, 18, "S");

	// Left decorative bar
	doc.setFillColor(...colorAccent);
	doc.rect(14, yPos, 3, 18, "F");

	doc.setTextColor(...colorPrimaryText);
	doc.setFontSize(11);
	doc.setFont(activeFont, "bold");
	doc.text(isHindi ? guide.title.hi : guide.title.en, 20, yPos + 6);

	doc.setTextColor(...colorMutedText);
	doc.setFontSize(8);
	doc.setFont(activeFont, "normal");
	const subtitleText = isHindi ? guide.subtitle.hi : guide.subtitle.en;
	doc.text(subtitleText, 20, yPos + 12);

	yPos += 24;

	// --- 3. Executive Purpose & Ethics Charter Callout ---
	doc.setFillColor(...colorWarmNeutral);
	doc.rect(14, yPos, pageWidth - 28, 38, "F");
	doc.setDrawColor(...colorBorder);
	doc.rect(14, yPos, pageWidth - 28, 38, "S");

	doc.setTextColor(...colorAccent);
	doc.setFontSize(9);
	doc.setFont(activeFont, "bold");
	doc.text(
		isHindi
			? "1. कार्यकारी अधिदेश एवं आचार संहिता चार्टर (Ethics & Governance)"
			: "1. EXECUTIVE MANDATE & ETHICS CHARTER",
		18,
		yPos + 6,
	);

	doc.setTextColor(...colorPrimaryText);
	doc.setFontSize(7.5);
	doc.setFont(activeFont, "normal");

	const summaryText = isHindi ? guide.summary.hi : guide.summary.en;
	const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 36);
	doc.text(splitSummary, 18, yPos + 11);

	let ethicsY = yPos + 18;
	const ethicsItems = isHindi
		? guide.ethicsHighlights.hi
		: guide.ethicsHighlights.en;
	for (const item of ethicsItems.slice(0, 4)) {
		doc.setFillColor(...colorAccent);
		doc.circle(20, ethicsY - 0.7, 0.8, "F");
		doc.setTextColor(...colorPrimaryText);
		doc.text(item, 23, ethicsY);
		ethicsY += 4.2;
	}

	yPos += 44;

	// --- 4. Section 2: Core Operating Standards & Boundaries Table ---
	doc.setTextColor(...colorPrimaryText);
	doc.setFontSize(9);
	doc.setFont(activeFont, "bold");
	doc.text(
		isHindi
			? "2. मुख्य परिचालन मानक एवं सीमाएं (Operating Standards & Boundaries)"
			: "2. CORE OPERATING STANDARDS & BOUNDARIES",
		14,
		yPos,
	);

	yPos += 3;

	const respHead = isHindi
		? [["कार्यक्षेत्र / दायित्व", "मानक संचालन प्रक्रिया (SOP)", "आचार संहिता एवं अनुपालन"]]
		: [["Responsibility / Domain", "Operating Standard / SOP", "Compliance & Ethics Mandate"]];

	const respBody = (isHindi ? guide.responsibilities.hi : guide.responsibilities.en).map(
		(r) => [r.area, r.standard, r.rule],
	);

	autoTable(doc, {
		startY: yPos,
		head: respHead,
		body: respBody,
		theme: "grid",
		styles: {
			font: activeFont,
			fontSize: 7.5,
			cellPadding: 2.5,
			textColor: colorPrimaryText,
			lineColor: colorBorder,
			lineWidth: 0.15,
		},
		headStyles: {
			fillColor: colorHeaderBg,
			textColor: [255, 255, 255],
			font: activeFont,
			fontStyle: "bold",
			fontSize: 8,
		},
		alternateRowStyles: {
			fillColor: colorWarmNeutral,
		},
		columnStyles: {
			0: { cellWidth: 42, fontStyle: "bold" },
			1: { cellWidth: 78 },
			2: { cellWidth: 62 },
		},
		margin: { left: 14, right: 14 },
	});

	// @ts-expect-error autoTable adds lastAutoTable to doc
	let currentY = doc.lastAutoTable.finalY + 8;

	// Check if page break is needed for Step-by-Step SOP
	if (currentY > pageHeight - 65) {
		doc.addPage();
		currentY = 20;
	}

	// --- 5. Section 3: Sequential Workflows Table ---
	doc.setTextColor(...colorPrimaryText);
	doc.setFontSize(9);
	doc.setFont(activeFont, "bold");
	doc.text(
		isHindi
			? "3. चरणबद्ध परिचालन कार्यप्रवाह (Step-by-Step SOP)"
			: "3. SEQUENTIAL OPERATING WORKFLOWS",
		14,
		currentY,
	);

	currentY += 3;

	const sopHead = isHindi
		? [["चरण / क्रम", "दैनिक कार्रवाई निर्देश", "गुणवत्ता एवं सुरक्षा नियम"]]
		: [["Phase / Step", "Required Action & Execution", "Quality & Compliance Verification"]];

	const sopBody = (isHindi ? guide.sopSteps.hi : guide.sopSteps.en).map(
		(s) => [s.step, s.action, s.compliance],
	);

	autoTable(doc, {
		startY: currentY,
		head: sopHead,
		body: sopBody,
		theme: "grid",
		styles: {
			font: activeFont,
			fontSize: 7.5,
			cellPadding: 2.5,
			textColor: colorPrimaryText,
			lineColor: colorBorder,
			lineWidth: 0.15,
		},
		headStyles: {
			fillColor: colorAccent,
			textColor: [255, 255, 255],
			font: activeFont,
			fontStyle: "bold",
			fontSize: 8,
		},
		alternateRowStyles: {
			fillColor: colorWarmNeutral,
		},
		columnStyles: {
			0: { cellWidth: 38, fontStyle: "bold" },
			1: { cellWidth: 82 },
			2: { cellWidth: 62 },
		},
		margin: { left: 14, right: 14 },
	});

	// @ts-expect-error autoTable adds lastAutoTable to doc
	currentY = doc.lastAutoTable.finalY + 8;

	if (currentY > pageHeight - 45) {
		doc.addPage();
		currentY = 20;
	}

	// --- 6. Section 4: Security & Support Protocol Box ---
	doc.setFillColor(...colorWarmNeutral);
	doc.rect(14, currentY, pageWidth - 28, 24, "F");
	doc.setDrawColor(...colorBorder);
	doc.rect(14, currentY, pageWidth - 28, 24, "S");

	doc.setFillColor(...colorAccent);
	doc.rect(14, currentY, 3, 24, "F");

	doc.setTextColor(...colorAccent);
	doc.setFontSize(8);
	doc.setFont(activeFont, "bold");
	doc.text(
		isHindi
			? "4. सुरक्षा, गोपनीयता एवं हेल्पडेस्क प्रोटोकॉल"
			: "4. SECURITY, DATA CONFIDENTIALITY & HELPDESK ESCALATION",
		20,
		currentY + 5,
	);

	doc.setTextColor(...colorPrimaryText);
	doc.setFontSize(7.2);
	doc.setFont(activeFont, "normal");

	const secItems = isHindi
		? guide.securityDirectives.hi
		: guide.securityDirectives.en;
	let secY = currentY + 10;
	for (const sec of secItems.slice(0, 2)) {
		doc.text(`•  ${sec}`, 20, secY);
		secY += 4.2;
	}

	doc.setTextColor(...colorMutedText);
	doc.setFontSize(6.8);
	doc.text(
		isHindi
			? "हेल्पडेस्क: support@evaluna.com | फोन: 9630649277 | विदिशा रोड, बैरसिया, भोपाल, म.प्र. - 463106"
			: "IT Helpdesk: support@evaluna.com | Phone: 9630649277 | Vidisha Road, Berasia, Bhopal, MP - 463106",
		20,
		currentY + 20,
	);

	// --- 7. Footers across all pages ---
	const totalPages = doc.getNumberOfPages();
	for (let i = 1; i <= totalPages; i++) {
		doc.setPage(i);
		doc.setDrawColor(...colorBorder);
		doc.setLineWidth(0.2);
		doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

		doc.setFont(activeFont, "normal");
		doc.setFontSize(6.8);
		doc.setTextColor(...colorMutedText);
		doc.text(
			"Evaluna Technologies Pvt. Ltd. • ISO 9001:2015 Operating Framework • Public & Employee Standard",
			14,
			pageHeight - 7,
		);
		doc.text(
			`${isHindi ? "पृष्ठ" : "Page"} ${i} / ${totalPages}`,
			pageWidth - 14,
			pageHeight - 7,
			{ align: "right" },
		);
	}

	return doc;
}

export async function generateGuidePdf(
	guide: GuideContent,
	language: "en" | "hi",
): Promise<void> {
	const doc = await buildGuidePdfDoc(guide, language);
	const langSuffix = language === "hi" ? "HI" : "EN";
	const cleanFileName = `Evaluna_${guide.id.replace(/-/g, "_")}_${langSuffix}.pdf`;
	doc.save(cleanFileName);
}
