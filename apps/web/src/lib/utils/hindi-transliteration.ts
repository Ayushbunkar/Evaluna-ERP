/**
 * Utility for phonetic Hindi transliteration of product names (FMCG / grocery / household).
 * As per requirement:
 * - Product format: "English Name (Hindi Transliteration)"
 * - Transliteration only, NOT dictionary translation (e.g. "Sarso Tel" -> "सरसों तेल", NOT "Mustard Oil").
 */

const DICT: Record<string, string> = {
	// Oils, Ghee & Fats
	sarso: "सरसों",
	sarson: "सरसों",
	tel: "तेल",
	tail: "तेल",
	oil: "तेल",
	refined: "रिफाइंड",
	ghee: "घी",
	butter: "बटर",
	makkhan: "मक्खन",
	vanaspati: "वनस्पति",

	// Staples, Grains & Flours
	atta: "आटा",
	aata: "आटा",
	chawal: "चावल",
	rice: "चावल",
	basmati: "बासमती",
	sela: "सेला",
	punjab: "पंजाब",
	dhruvraj: "ध्रुवराज",
	roazana: "रोजाना",
	rozana: "रोजाना",
	besan: "बेसन",
	maida: "मैदा",
	rava: "रवा",
	suji: "सूजी",
	sooji: "सूजी",
	poha: "पोहा",
	makka: "मक्का",
	maize: "मक्का",
	corn: "कॉर्न",
	parmal: "परमल",
	sabudana: "साबूदाना",
	soyabadi: "सोयाबड़ी",

	// Dals & Pulses
	dal: "दाल",
	daal: "दाल",
	tuar: "तुअर",
	toor: "तुअर",
	moong: "मूंग",
	mung: "मूंग",
	chana: "चना",
	channa: "चना",
	urad: "उड़द",
	masoor: "मसूर",
	rajma: "राजमा",
	chhole: "छोले",

	// Spices & Condiments
	mirch: "मिर्च",
	chilli: "मिर्च",
	haldi: "हल्दी",
	turmeric: "हल्दी",
	dhaniya: "धनिया",
	coriander: "धनिया",
	zeera: "जीरा",
	jeera: "जीरा",
	cumin: "जीरा",
	hing: "हींग",
	long: "लौंग",
	laung: "लौंग",
	clove: "लौंग",
	elaichi: "इलायची",
	cardamom: "इलायची",
	kali: "काली",
	dalchini: "दालचीनी",
	cinnamon: "दालचीनी",
	adarak: "अदरक",
	adrak: "अदरक",
	ginger: "अदरक",
	lehsun: "लहसुन",
	garlic: "लहसुन",
	paste: "पेस्ट",
	masala: "मसाला",
	garam: "गरम",
	garama: "गरम",
	khada: "खड़ा",
	powder: "पाउडर",
	namak: "नमक",
	salt: "नमक",
	sendha: "सेंधा",
	kala: "काला",
	dandi: "दांडी",
	sungold: "सनगोल्ड",
	meetha: "मीठा",
	soda: "सोडा",
	azbain: "अजवाइन",
	ajwain: "अजवाइन",
	kasuri: "कसूरी",
	methi: "मेथी",
	saunf: "सौंफ",
	chironji: "चिरौंजी",
	imli: "इमली",
	imali: "इमली",
	churan: "चूर्ण",

	// Dry Fruits & Nuts
	moongfali: "मूंगफली",
	mumfali: "मूंगफली",
	peanut: "मूंगफली",
	kaju: "काजू",
	cashew: "काजू",
	badam: "बादाम",
	almond: "बादाम",
	kismis: "किशमिश",
	kishmish: "किशमिश",
	raisin: "किशमिश",
	pista: "पिस्ता",
	khopra: "खोपरा",
	nariyal: "नारियल",
	coconut: "नारियल",
	kalikat: "कालीकट",
	lachcha: "लच्छा",
	dane: "दाने",
	kachche: "कच्चे",
	kacche: "कच्चे",
	siki: "सिकी",
	sikhe: "सिके",
	kati: "कटी",

	// Biscuits, Snacks & Namkeen
	biscuit: "बिस्कुट",
	biscut: "बिस्कुट",
	namkeen: "नमकीन",
	sev: "सेव",
	bhujia: "भुजिया",
	chips: "चिप्स",
	toast: "टोस्ट",
	latkan: "लटकन",
	rusk: "रस्क",
	maggie: "मैगी",
	maggi: "मैगी",
	noodle: "नूडल",
	noodles: "नूडल्स",
	pasta: "पास्ता",
	khakhra: "खाखरा",
	papad: "पापड़",
	khatta: "खट्टा",
	punga: "पुंगा",
	mix: "मिक्स",
	gajak: "गजक",
	revdi: "रेवड़ी",
	laddu: "लड्डू",
	ladoo: "लड्डू",
	gulab: "गुलाब",
	jamun: "जामुन",
	mishri: "मिश्री",
	prasad: "प्रसाद",
	sweet: "मीठा",
	sweety: "स्वीटी",
	supari: "सुपारी",
	ritik: "रितिक",
	soni: "सोनी",

	// Beverages, Tea & Coffee
	chaay: "चाय",
	chai: "चाय",
	tea: "चाय",
	coffee: "कॉफी",
	doodh: "दूध",
	milk: "दूध",
	dahi: "दही",
	curd: "दही",
	lassi: "लस्सी",
	sharbat: "शरबत",
	sharbath: "शरबत",
	frooti: "फ्रूटी",
	sprite: "स्प्राइट",
	pepsi: "पेप्सी",
	coke: "कोक",
	maaza: "माजा",
	appy: "एपी",

	// Soaps, Detergents & Cleaning
	sabun: "साबुन",
	soap: "साबुन",
	detergent: "डिटर्जेंट",
	surf: "सर्फ",
	excel: "एक्सेल",
	vim: "विम",
	wheel: "व्हील",
	ghadi: "घड़ी",
	ghadhi: "घड़ी",
	lux: "लक्स",
	lifebuoy: "लाइफबॉय",
	lifebouy: "लाइफबॉय",
	dettol: "डेटॉल",
	dove: "डव",
	ariel: "एरियल",
	nima: "निमा",
	sandle: "सैंडल",
	sandal: "सैंडल",
	harpic: "हार्पिक",
	colin: "कोलिन",
	rin: "रिन",
	tide: "टाइड",

	// Personal Care, Shampoos & Creams
	shampoo: "शैम्पू",
	chik: "चिक",
	clinic: "क्लिनिक",
	plus: "प्लस",
	sunsilk: "सनसिल्क",
	vatika: "वाटिका",
	head: "हेड",
	shoulder: "शोल्डर",
	shoulders: "शोल्डर",
	kesh: "केश",
	kanti: "कांति",
	amla: "आंवला",
	shanti: "शांति",
	fair: "फेयर",
	lovely: "लवली",
	cream: "क्रीम",
	lotion: "लोशन",
	powder_pc: "पाउडर",
	toothpaste: "टूथपेस्ट",
	toothbrush: "टूथब्रश",
	closeup: "क्लोज़अप",
	babool: "बबूल",
	colgate: "कोलगेट",
	hajmaula: "हजमोला",
	henna: "मेहंदी",
	mehandi: "मेहंदी",
	mehndi: "मेहंदी",

	// Pooja & Household
	agarbatti: "अगरबत्ती",
	pooja: "पूजा",
	path: "पाठ",
	roli: "रोली",
	chandan: "चंदन",
	rui: "रूई",
	batti: "बत्ती",
	janeu: "जनेऊ",
	matchis: "माचिस",
	machis: "माचिस",
	chirag: "चिराग",
	polythene: "पॉलिथीन",
	disposal: "डिस्पोजल",
	cell: "सेल",
	patla: "पतला",
	eveready: "एवरेडी",
	chuna: "चूना",
	tube: "ट्यूब",

	// Tobacco & Pan Masala
	zarda: "जर्दा",
	bidi: "बीड़ी",
	beedi: "बीड़ी",
	cigarette: "सिगरेट",
	sigret: "सिगरेट",
	chakki: "चक्की",
	sher: "शेर",
	rajshree: "राजश्री",
	vimal: "विमल",
	paheli: "पहेली",
	liberty: "लिबर्टी",
	american: "अमेरिकन",
	indimint: "इंडीमिंट",
	mint: "मिंट",
	gold: "गोल्ड",
	flake: "फ्लेक",
	migland: "मिगलैंड",
	advance: "एडवांस",
	advanced: "एडवांस",
	online: "ऑनलाइन",

	// Confectionery & Chocolates
	chocolate: "चॉकलेट",
	sneaker: "स्नीकर",
	snickers: "स्निकर्स",
	center: "सेंटर",
	fruit: "फ्रूट",
	hunk: "हंक",
	eclairs: "एक्लेयर्स",

	// Common Brands & Qualities
	parle: "पारले",
	patanjali: "पतंजलि",
	babuji: "बाबूजी",
	bharat: "भारत",
	balaji: "बालाजी",
	kundan: "कुंदन",
	bpl: "बीपीएल",
	vip: "वीआईपी",
	pushp: "पुष्प",
	shankar: "शंकर",
	swastik: "स्वास्तिक",
	tiger: "टाइगर",
	happy: "हैप्पी",
	bansal: "बंसल",
	varlaxmi: "वरलक्ष्मी",
	sachchai: "सच्चाई",
	nakhrali: "नखराली",
	chicken: "चिकन",
	ghar: "घर",
	grahasthi: "गृहस्थी",
	special: "स्पेशल",
	moti: "मोती",
	khulla: "खुला",
	blue: "ब्लू",
	red: "लाल",
	green: "हरा",
	yellow: "पीला",
	black: "काला",
	white: "सफेद",
	lal_color: "लाल",
	hara_color: "हरा",
	peela_color: "पीला",
	kala_color: "काला",

	// Units & Packaging words
	packet: "पैकेट",
	pack: "पैक",
	bag: "बैग",
	box: "बॉक्स",
	crate: "क्रेट",
	sack: "कट्टा",
	set: "सेट",
	outer: "आउटर",
	pc: "पीस",
	pcs: "पीस",
	pese: "पैसे",
	paise: "पैसे",
	rs: "Rs",
};

/**
 * Phonetic character-level transliteration fallback for unseen words.
 */
function phoneticTransliterateWord(word: string): string {
	const lower = word.toLowerCase().trim();
	if (!lower) return "";

	// Check dictionary first
	if (DICT[lower]) {
		return DICT[lower];
	}

	// Keep pure numbers / units as is: "10kg", "500g", "1Ltr", "Rs"
	if (/^[0-9]+(\.[0-9]+)?(kg|g|gm|l|ltr|ml|pc|pcs|m)?$/i.test(lower)) {
		return word;
	}
	if (/^rs\.?[0-9]*$/i.test(lower)) {
		return word;
	}

	// Basic English to Hindi phonetic rule replacement
	let s = lower;
	s = s.replace(/sh/g, "श");
	s = s.replace(/th/g, "थ");
	s = s.replace(/ch/g, "च");
	s = s.replace(/kh/g, "ख");
	s = s.replace(/gh/g, "घ");
	s = s.replace(/jh/g, "झ");
	s = s.replace(/bh/g, "भ");
	s = s.replace(/dh/g, "ध");
	s = s.replace(/ph/g, "फ");
	s = s.replace(/ee/g, "ी");
	s = s.replace(/oo/g, "ू");
	s = s.replace(/aa/g, "ा");
	s = s.replace(/ai/g, "ै");
	s = s.replace(/au/g, "ौ");
	s = s.replace(/k/g, "क");
	s = s.replace(/g/g, "ग");
	s = s.replace(/c/g, "क");
	s = s.replace(/j/g, "ज");
	s = s.replace(/z/g, "ज");
	s = s.replace(/t/g, "ट");
	s = s.replace(/d/g, "ड");
	s = s.replace(/n/g, "न");
	s = s.replace(/p/g, "प");
	s = s.replace(/f/g, "फ");
	s = s.replace(/b/g, "ब");
	s = s.replace(/m/g, "म");
	s = s.replace(/y/g, "य");
	s = s.replace(/r/g, "र");
	s = s.replace(/l/g, "ल");
	s = s.replace(/v/g, "व");
	s = s.replace(/w/g, "व");
	s = s.replace(/s/g, "स");
	s = s.replace(/h/g, "ह");
	s = s.replace(/a/g, "ा");
	s = s.replace(/e/g, "े");
	s = s.replace(/i/g, "ि");
	s = s.replace(/o/g, "ो");
	s = s.replace(/u/g, "ु");

	return s;
}

/**
 * Transliterates an entire product phrase to Hindi transliteration.
 */
export function transliteratePhraseToHindi(phrase: string): string {
	const words = phrase.trim().split(/\s+/);
	const translatedWords = words.map((w) => {
		// Clean punctuation
		const clean = w.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");
		if (!clean) return w;
		const hindi = DICT[clean.toLowerCase()] || phoneticTransliterateWord(clean);
		return w.replace(clean, hindi);
	});
	return translatedWords.join(" ");
}

/**
 * Takes a product name and returns "English Name (Hindi Transliteration)".
 * If the product name already contains brackets "(...)", it returns the normalized name.
 */
export function toBilingualProductName(name: string): string {
	const trimmed = (name || "").trim();
	if (!trimmed) return "";

	// Already has brackets: "Sarso Oil (सरसों तेल)"
	if (/\(.*?\)/.test(trimmed)) {
		return trimmed;
	}

	const hindiPart = transliteratePhraseToHindi(trimmed);
	if (!hindiPart || hindiPart.toLowerCase() === trimmed.toLowerCase()) {
		return trimmed;
	}

	return `${trimmed} (${hindiPart})`;
}
