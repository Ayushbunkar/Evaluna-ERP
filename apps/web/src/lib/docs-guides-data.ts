export interface GuideContent {
	id: string;
	title: {
		en: string;
		hi: string;
	};
	subtitle: {
		en: string;
		hi: string;
	};
	category: "department" | "quick-reference";
	badge: {
		en: string;
		hi: string;
	};
	summary: {
		en: string;
		hi: string;
	};
	ethicsHighlights: {
		en: string[];
		hi: string[];
	};
	sopSteps: {
		en: { step: string; action: string; compliance: string }[];
		hi: { step: string; action: string; compliance: string }[];
	};
	responsibilities: {
		en: { area: string; standard: string; rule: string }[];
		hi: { area: string; standard: string; rule: string }[];
	};
	securityDirectives: {
		en: string[];
		hi: string[];
	};
}

export const DOCS_GUIDES: Record<string, GuideContent> = {
	"sales-guide": {
		id: "sales-guide",
		category: "department",
		title: {
			en: "Sales Team Standard Operating Procedures & Ethics Manual",
			hi: "बिक्री टीम मानक संचालन प्रक्रिया एवं आचार संहिता नियमावली",
		},
		subtitle: {
			en: "Public Operating Guidelines for Point-of-Sale, Client Engagement & Billing Integrity",
			hi: "पॉइंट-ऑफ-सेल, ग्राहक सेवा एवं बिलिंग शुचिता हेतु सार्वजनिक संचालन दिशानिर्देश",
		},
		badge: {
			en: "Department Guide",
			hi: "विभागीय मार्गदर्शिका",
		},
		summary: {
			en: "This manual establishes operational protocols for sales representatives and billers at Evaluna. It prioritizes customer transparency, tax compliance, and fair trading while safeguarding enterprise security.",
			hi: "यह नियमावली इवालूना के बिक्री प्रतिनिधियों एवं बिलरों हेतु संचालन मानक स्थापित करती है। यह ग्राहक पारदर्शिता, कर अनुपालन एवं सुरक्षित व्यापार को प्राथमिकता देती है।",
		},
		ethicsHighlights: {
			en: [
				"Honest and unalterable customer billing without hidden charges.",
				"Mandatory issuance of digital or printed GST invoices for all transactions.",
				"Zero tolerance for unauthorized price modifications or manual discount overriding.",
				"Absolute protection of customer telephone numbers, addresses, and payment data.",
				"Respectful, professional, and non-discriminatory service to all patrons.",
			],
			hi: [
				"बिना किसी छुपे शुल्क के ईमानदार एवं पारदर्शी ग्राहक बिलिंग।",
				"सभी लेन-देन के लिए डिजिटल या मुद्रित जीएसटी चालान जारी करना अनिवार्य।",
				"अनधिकृत मूल्य छूट या सिस्टम से छेड़छाड़ की सख्त मनाही।",
				"ग्राहकों के संपर्क विवरण एवं भुगतान जानकारी की पूर्ण गोपनीयता।",
				"सभी ग्राहकों के साथ विनम्र, निष्पक्ष एवं पेशेवर व्यवहार।",
			],
		},
		responsibilities: {
			en: [
				{
					area: "Counter Sales & POS",
					standard: "Verify physical goods before scanning barcode into active cart.",
					rule: "Never bypass barcode scanning with generic dummy SKUs.",
				},
				{
					area: "Payment Acceptance",
					standard: "Record exact mode of tender (UPI, Cash, Card, Credit).",
					rule: "Cash receipts must be balanced and logged before shift handover.",
				},
				{
					area: "Returns & Exchanges",
					standard: "Inspect item condition and original invoice timestamp.",
					rule: "All refunds require authorized supervisor sign-off.",
				},
				{
					area: "Client Quotations",
					standard: "Quotes are valid strictly for designated credit window (14 days).",
					rule: "Honor company pricing policy without private side-agreements.",
				},
			],
			hi: [
				{
					area: "काउंटर बिक्री एवं पीओएस",
					standard: "सक्रिय कार्ट में स्कैन करने से पहले भौतिक माल का सत्यापन करें।",
					rule: "बिना बारकोड स्कैन किए डमी कोड का उपयोग कभी न करें।",
				},
				{
					area: "भुगतान प्राप्ति",
					standard: "भुगतान का सही माध्यम (यूपीआई, नकद, कार्ड) प्रणाली में दर्ज करें।",
					rule: "शिफ्ट समाप्ति पर नकद राशि का मिलान एवं रिपोर्टिंग अनिवार्य है।",
				},
				{
					area: "वापसी एवं विनिमय",
					standard: "वस्तु की स्थिति एवं मूल चालान की तारीख की जांच करें।",
					rule: "सभी रिफंड हेतु अधिकृत सुपरवाइजर की स्वीकृति आवश्यक है।",
				},
				{
					area: "ग्राहक कोटेशन",
					standard: "कोटेशन केवल निर्धारित अवधि (14 दिन) हेतु मान्य होते हैं।",
					rule: "कंपनी की मूल्य नीति का पालन करें, निजी वादे न करें।",
				},
			],
		},
		sopSteps: {
			en: [
				{
					step: "Phase 1: Shift Opening",
					action: "Log in with unique credentials. Verify drawer opening balance.",
					compliance: "Never share terminal logins with colleagues.",
				},
				{
					step: "Phase 2: Cart Creation",
					action: "Scan product UPC/EAN. Verify unit price and applied tax slabs.",
					compliance: "Ensure accurate batch selection for perishable items.",
				},
				{
					step: "Phase 3: Checkout Settlement",
					action: "Present total amount clearly to buyer. Confirm payment receipt.",
					compliance: "Provide instant physical or SMS receipt to the customer.",
				},
				{
					step: "Phase 4: Day-End Closing",
					action: "Execute shift reconciliation report and deposit cash into safe.",
					compliance: "Discrepancies exceeding 100 INR must be immediately escalated.",
				},
			],
			hi: [
				{
					step: "चरण 1: शिफ्ट शुरुआत",
					action: "अपनी व्यक्तिगत आईडी से लॉगिन करें। ओपनिंग कैश का मिलान करें।",
					compliance: "अपना टर्मिनल पासवर्ड किसी अन्य सहकर्मी के साथ साझा न करें।",
				},
				{
					step: "चरण 2: कार्ट निर्माण",
					action: "उत्पाद बारकोड स्कैन करें। दर एवं लागू टैक्स स्लैब सत्यापित करें।",
					compliance: "शीघ्र खराब होने वाले सामान हेतु सही बैच का चयन सुनिश्चित करें।",
				},
				{
					step: "चरण 3: बिल निपटान",
					action: "ग्राहक को कुल राशि स्पष्ट बताएं। भुगतान की पुष्टि करें।",
					compliance: "ग्राहक को तत्काल मुद्रित या डिजिटल रसीद प्रदान करें।",
				},
				{
					step: "चरण 4: दिन की समाप्ति",
					action: "दैनिक मिलान रिपोर्ट निकालें एवं नकद राशि तिजोरी में जमा करें।",
					compliance: "किसी भी विसंगति पर तत्काल प्रबंधक को सूचित करें।",
				},
			],
		},
		securityDirectives: {
			en: [
				"Terminals must automatically lock after 5 minutes of inactivity.",
				"No external USB storage devices or unauthorized peripherals may be connected to sales hardware.",
				"Report customer disputes or suspicious transaction attempts directly to the Store Manager.",
			],
			hi: [
				"निष्क्रिय रहने पर टर्मिनल 5 मिनट में स्वतः लॉक होना अनिवार्य है।",
				"बिक्री हार्डवेयर पर कोई भी बाहरी यूएसबी या अनाधिकृत उपकरण न लगाएं।",
				"किसी भी संदिग्ध लेनदेन या विवाद की सूचना तुरंत स्टोर प्रबंधक को दें।",
			],
		},
	},

	"finance-guide": {
		id: "finance-guide",
		category: "department",
		title: {
			en: "Finance & Accounting Governance and Ethics Manual",
			hi: "वित्त एवं लेखांकन सुशासन एवं आचार संहिता नियमावली",
		},
		subtitle: {
			en: "Fiscal Integrity, Ledger Discipline, Statutory Compliance & Audit Controls",
			hi: "वित्तीय शुचिता, बहीखाता अनुशासन, वैधानिक अनुपालन एवं ऑडिट नियंत्रण",
		},
		badge: {
			en: "Department Guide",
			hi: "विभागीय मार्गदर्शिका",
		},
		summary: {
			en: "Governs all financial disbursements, ledger entries, tax filings, and account reconciliations across Evaluna. Enforces zero tolerance for fraud, strict dual-authorization, and audit transparency.",
			hi: "इवालूना में वित्तीय भुगतानों, खाता प्रविष्टियों, कर विवरणी एवं बैंक समाधान को नियंत्रित करता है। यह धोखाधड़ी के प्रति शून्य सहनशीलता तथा दोहरी मंजूरी लागू करता है।",
		},
		ethicsHighlights: {
			en: [
				"Absolute segregation of duties between bill creation and fund disbursement.",
				"Dual-authorization required on all banking transfers and high-value payments.",
				"Accurate recording of all expenses with verifiable tax invoices and receipts.",
				"Timely and honest submission of statutory GST, TDS, and PF liabilities.",
				"Complete preservation of immutable financial audit trails.",
			],
			hi: [
				"बिल निर्माण एवं भुगतान स्वीकृति के बीच स्पष्ट कार्य पृथक्करण।",
				"सभी बैंक ट्रांसफर एवं बड़े भुगतानों पर दोहरी स्वीकृति अनिवार्य।",
				"मान्य टैक्स इनवॉइस के आधार पर ही सभी खर्चों की सटीक प्रविष्टि।",
				"जीएसटी, टीडीएस एवं पीएफ का समय पर व पूर्ण ईमानदारी से भुगतान।",
				"सभी वित्तीय ऑडिट रिकॉर्ड्स का सुरक्षित एवं अपरिवर्तनीय रखरखाव।",
			],
		},
		responsibilities: {
			en: [
				{
					area: "Accounts Payable",
					standard: "Perform 3-way matching: Purchase Order + Goods Receipt + Invoice.",
					rule: "Never issue payment against unverified or duplicate vendor bills.",
				},
				{
					area: "Payroll Processing",
					standard: "Verify attendance logs and supervisor approvals prior to calculation.",
					rule: "Employee salary details are strictly confidential and protected.",
				},
				{
					area: "Bank Reconciliation",
					standard: "Reconcile daily bank statements against ERP cashbook ledgers.",
					rule: "All unidentified deposits or charges must be flagged within 24 hours.",
				},
				{
					area: "Petty Cash",
					standard: "Maintain imprest balance with numbered physical payment vouchers.",
					rule: "Personal loans or advances from petty cash are strictly forbidden.",
				},
			],
			hi: [
				{
					area: "देय खाते (AP)",
					standard: "3-पक्षीय मिलान करें: खरीद आदेश + माल प्राप्ति + विक्रेता बिल।",
					rule: "बिना सत्यापन या डुप्लिकेट बिल पर भुगतान कभी जारी न करें।",
				},
				{
					area: "वेतन प्रसंस्करण",
					standard: "गणना से पूर्व उपस्थिति और सुपरवाइजर स्वीकृति का सत्यापन करें।",
					rule: "कर्मचारियों का वेतन विवरण पूर्णतः गोपनीय रखा जाना अनिवार्य है।",
				},
				{
					area: "बैंक समाधान",
					standard: "दैनिक बैंक स्टेटमेंट का सिस्टम कैशबुक के साथ अनिवार्य मिलान करें।",
					rule: "अज्ञात शुल्कों या जमा राशि को 24 घंटे के भीतर चिन्हित करें।",
				},
				{
					area: "पेटी कैश (फुटकर खर्च)",
					standard: "हस्ताक्षरित भौतिक वाउचर के साथ ही नकद भुगतान करें।",
					rule: "पेटी कैश से व्यक्तिगत ऋण या अग्रिम लेना पूर्णतः प्रतिबंधित है।",
				},
			],
		},
		sopSteps: {
			en: [
				{
					step: "Phase 1: Voucher Inward",
					action: "Record incoming supplier invoice with GSTIN and HSN classification.",
					compliance: "Validate vendor active GST status on the national portal.",
				},
				{
					step: "Phase 2: Verification",
					action: "Cross-check billed quantities against verified warehouse GRN entries.",
					compliance: "Ensure price variance does not exceed approved quotation rate.",
				},
				{
					step: "Phase 3: Disbursement",
					action: "Batch approved payments for release via secured corporate banking.",
					compliance: "Two distinct officers must approve all release batches.",
				},
				{
					step: "Phase 4: Month-End Close",
					action: "Finalize depreciation, prepayments, and close fiscal period.",
					compliance: "No manual ledger entries allowed after period sign-off.",
				},
			],
			hi: [
				{
					step: "चरण 1: वाउचर प्राप्ति",
					action: "जीएसटी एवं एचएसएन कोड के साथ विक्रेता बिल सिस्टम में दर्ज करें।",
					compliance: "राष्ट्रीय पोर्टल पर विक्रेता की सक्रिय जीएसटी स्थिति जांचें।",
				},
				{
					step: "चरण 2: मिलान व सत्यापन",
					action: "वेयरहाउस माल प्राप्ति (GRN) के साथ बिल मात्रा का मिलान करें।",
					compliance: "स्वीकृत कोटेशन दर से अधिक राशि का भुगतान न होने दें।",
				},
				{
					step: "चरण 3: भुगतान जारी करना",
					action: "कॉरपोरेट बैंकिंग के माध्यम से स्वीकृत भुगतानों को निष्पादित करें।",
					compliance: "भुगतान बैच पर दो अलग-अलग अधिकारियों की मंजूरी आवश्यक है।",
				},
				{
					step: "चरण 4: माह-अंत क्लोजिंग",
					action: "महीने की प्रविष्टियों का समाधान करें और खाता अवधि बंद करें।",
					compliance: "क्लोजिंग के उपरांत बैक-डेटेड प्रविष्टियां पूर्णतः वर्जित हैं।",
				},
			],
		},
		securityDirectives: {
			en: [
				"Banking OTPs and hardware cryptographic tokens must never be shared across team members.",
				"Audit logs must remain immutable and are reviewed weekly by the Chief Auditor.",
				"Immediate reporting of any duplicate disbursement or unauthorized ledger change.",
			],
			hi: [
				"बैंकिंग ओटीपी या टोकन किसी भी सहकर्मी से साझा करना सख्त मना है।",
				"ऑडिट लॉग्स में छेड़छाड़ असंभव है और इनकी साप्ताहिक समीक्षा होती है।",
				"किसी भी गलत भुगतान की सूचना तत्काल मुख्य ऑडिटर को दें।",
			],
		},
	},

	"operations-guide": {
		id: "operations-guide",
		category: "department",
		title: {
			en: "Operations & Warehouse Management Standard Procedures",
			hi: "संचालन एवं वेयरहाउस प्रबंधन मानक संचालन नियमावली",
		},
		subtitle: {
			en: "Inventory Stewardship, FEFO Quality Control & Safe Material Logistics",
			hi: "इन्वेंटरी सुरक्षा, एफईएफओ गुणवत्ता नियंत्रण एवं सुरक्षित सामग्री प्रबंधन",
		},
		badge: {
			en: "Department Guide",
			hi: "विभागीय मार्गदर्शिका",
		},
		summary: {
			en: "Defines protocols for receiving, bin storage, FEFO (First-Expired, First-Out) picking, dispatch, and physical audits across regional warehouses in Bhopal and Berasia.",
			hi: "भोपाल एवं बैरसिया के क्षेत्रीय वेयरहाउसों में माल प्राप्ति, स्टोरेज, एफईएफओ पिकिंग, प्रेषण एवं भौतिक ऑडिट के मानक निर्धारित करता है।",
		},
		ethicsHighlights: {
			en: [
				"Honest recording of physical stock counts without inflating or hiding shortages.",
				"Strict adherence to FEFO: near-expiry goods must be dispatched first.",
				"Immediate quarantine and segregation of damaged or compromised inventory.",
				"Commitment to workplace safety, ergonomic standards, and clean facility aisles.",
				"Protection of physical warehouse assets against damage, pilferage, and spoilage.",
			],
			hi: [
				"स्टॉक की सही भौतिक गिनती दर्ज करना, कमी या आधिक्य को न छुपाना।",
				"एफईएफओ का कड़ा पालन: पहले एक्सपायर होने वाला माल पहले निकाला जाए।",
				"क्षतिग्रस्त या खराब माल को तत्काल अलग (क्वारंटाइन) करना।",
				"कार्यस्थल सुरक्षा, साफ-सफाई एवं उचित रख-रखाव के प्रति प्रतिबद्धता।",
				"सामग्री को टूट-फूट, चोरी अथवा खराब होने से बचाने की नैतिक जिम्मेदारी।",
			],
		},
		responsibilities: {
			en: [
				{
					area: "Goods Inward (Inbound)",
					standard: "Verify physical delivery against supplier delivery challan.",
					rule: "Log batch numbers, manufacturing dates, and expiry dates accurately.",
				},
				{
					area: "Bin Allocation (Putaway)",
					standard: "Store items in designated bin locations with readable barcode labels.",
					rule: "Never place stock in aisles, walkways, or unassigned floor locations.",
				},
				{
					area: "Dispatch Picking (Outbound)",
					standard: "Follow system-directed FEFO picking lists without manual skipping.",
					rule: "Never pick newer batches if older valid batches remain in stock.",
				},
				{
					area: "Cycle Auditing",
					standard: "Conduct scheduled rolling counts of high-value SKUs every week.",
					rule: "Report discrepancies immediately for supervisor investigation.",
				},
			],
			hi: [
				{
					area: "आवक माल (इनबाउंड)",
					standard: "आपूर्तिकर्ता चालान के साथ प्राप्त माल का भौतिक मिलान करें।",
					rule: "बैच नंबर, निर्माण तिथि एवं समाप्ति तिथि को सही-सही दर्ज करें।",
				},
				{
					area: "स्टोरेज एवं पुटावे",
					standard: "निर्धारित रैक एवं बिन में बारकोड लेबल लगाकर व्यवस्थित रखें।",
					rule: "रास्तों या अनाधिकृत स्थानों पर माल कभी न छोड़ें।",
				},
				{
					area: "जावक पिकिंग (आउटबाउंड)",
					standard: "सिस्टम द्वारा सुझाई गई एफईएफओ पिकिंग सूची का अनिवार्य पालन करें।",
					rule: "पुराने वैध बैच उपलब्ध रहते नए बैच से माल कभी न निकालें।",
				},
				{
					area: "नियमित स्टॉक गणना",
					standard: "प्रत्येक सप्ताह महत्वपूर्ण वस्तुओं की नियमित गिनती करें।",
					rule: "किसी भी अंतर की तुरंत जांच हेतु सुपरवाइजर को रिपोर्ट करें।",
				},
			],
		},
		sopSteps: {
			en: [
				{
					step: "Phase 1: Dock Unloading",
					action: "Inspect seal integrity, count package boxes, and note visible damage.",
					compliance: "Reject visibly water-damaged or tampered cartons on challan.",
				},
				{
					step: "Phase 2: Barcode Inwarding",
					action: "Scan items into ERP WMS. System auto-generates internal lot tags.",
					compliance: "Affix clear batch barcodes before moving goods to storage racks.",
				},
				{
					step: "Phase 3: Order Picking",
					action: "Follow ERP picking sequence ensuring earliest expiry is retrieved.",
					compliance: "Scan bin location and item batch to verify dispatch fidelity.",
				},
				{
					step: "Phase 4: Outbound Staging",
					action: "Pack items with protective materials and attach dispatch manifests.",
					compliance: "Obtain driver signature on the outbound gate pass before release.",
				},
			],
			hi: [
				{
					step: "चरण 1: अनलोडिंग एवं जांच",
					action: "सील की जांच करें, पेटियों की गिनती करें एवं क्षति का निरीक्षण करें।",
					compliance: "क्षतिग्रस्त अथवा टूटे हुए पैकेट्स को चालान पर तुरंत नोट करें।",
				},
				{
					step: "चरण 2: बारकोड इनवर्ड",
					action: "सिस्टम में माल दर्ज करें और संबंधित बैच टैग प्रिंट करें।",
					compliance: "रैक में रखने से पूर्व प्रत्येक कार्टन पर बारकोड लेबल अवश्य लगाएं।",
				},
				{
					step: "चरण 3: ऑर्डर पिकिंग",
					action: "एफईएफओ अनुक्रम का पालन करते हुए पुराने बैच का चयन करें।",
					compliance: "पिकिंग के दौरान सही बिन और बैच की पुष्टि हेतु बारकोड स्कैन करें।",
				},
				{
					step: "चरण 4: प्रेषण एवं गेट पास",
					action: "सामग्री की सुरक्षित पैकिंग करें एवं डिस्पैच चालान संलग्न करें।",
					compliance: "गेट पास पर चालक के हस्ताक्षर लेने के बाद ही वाहन रवाना करें।",
				},
			],
		},
		securityDirectives: {
			en: [
				"Warehouse loading bays and storage sections are restricted to authorized personnel only.",
				"Personal bags and uninspected tools are prohibited on the warehouse floor.",
				"All stock write-offs require double manager sign-off and photographic proof.",
			],
			hi: [
				"वेयरहाउस एवं लोडिंग एरिया में केवल अधिकृत कर्मचारियों का प्रवेश मान्य है।",
				"वेयरहाउस तल पर व्यक्तिगत बैग अथवा अनाधिकृत उपकरण ले जाना वर्जित है।",
				"किसी भी माल को स्क्रैप करने हेतु दो प्रबंधकों की स्वीकृति व फोटो साक्ष्य आवश्यक है।",
			],
		},
	},

	"hr-guide": {
		id: "hr-guide",
		category: "department",
		title: {
			en: "Human Resources, Workplace Conduct & Ethics Handbook",
			hi: "मानव संसाधन, कार्यस्थल आचरण एवं आचार संहिता पुस्तिका",
		},
		subtitle: {
			en: "Employee Welfare, Equal Opportunity, Fair Appraisals & Code of Conduct",
			hi: "कर्मचारी कल्याण, समान अवसर, निष्पक्ष मूल्यांकन एवं आचरण संहिता",
		},
		badge: {
			en: "Department Guide",
			hi: "विभागीय मार्गदर्शिका",
		},
		summary: {
			en: "Sets forth policies on mutual respect, harassment prevention (POSH), attendance fidelity, wage transparency, and confidential grievance redressal for all Evaluna personnel.",
			hi: "इवालूना के समस्त कर्मचारियों हेतु आपसी सम्मान, उत्पीड़न रोकथाम, उपस्थिति शुचिता, निष्पक्ष पारिश्रमिक एवं गोपनीय शिकायत निवारण के नियम निर्धारित करता है।",
		},
		ethicsHighlights: {
			en: [
				"Zero tolerance for workplace harassment, discrimination, or intimidation.",
				"Equal opportunity employment irrespective of caste, religion, gender, or background.",
				"Strict protection of employee personal identity and compensation records.",
				"Fidelity in attendance logging: proxy punches or false records result in termination.",
				"Open-door communication with transparent grievance escalation channels.",
			],
			hi: [
				"कार्यस्थल पर किसी भी प्रकार के उत्पीड़न या भेदभाव के प्रति शून्य सहनशीलता।",
				"जाति, धर्म, लिंग या पृष्ठभूमि से परे सभी हेतु समान अवसर।",
				"कर्मचारियों की व्यक्तिगत जानकारी एवं वेतन विवरण की पूर्ण गोपनीयता।",
				"उपस्थिति में पूर्ण ईमानदारी: प्रॉक्सी हाजिरी लगाने पर सख्त अनुशासनात्मक कार्रवाई।",
				"खुला संवाद एवं निष्पक्ष, पारदर्शी शिकायत निवारण तंत्र।",
			],
		},
		responsibilities: {
			en: [
				{
					area: "Attendance & Punctuality",
					standard: "Punch attendance using biometric or assigned mobile geo-fenced portal.",
					rule: "Promptly inform department leads in case of emergency leave or delays.",
				},
				{
					area: "Workplace Decorum",
					standard: "Maintain clean attire, professional vocabulary, and courteous demeanor.",
					rule: "Verbal abuse, harassment, or aggressive conduct is strictly prohibited.",
				},
				{
					area: "Leave Administration",
					standard: "Submit planned leave requests via ERP portal at least 48 hours in advance.",
					rule: "Unauthorized absence exceeding 3 consecutive days will initiate review.",
				},
				{
					area: "Asset Stewardship",
					standard: "Safeguard issued company laptops, smartphones, scanners, and uniforms.",
					rule: "Report damaged or misplaced hardware to HR / IT within 12 hours.",
				},
			],
			hi: [
				{
					area: "उपस्थिति एवं समयबद्धता",
					standard: "बायोमेट्रिक अथवा अधिकृत सिस्टम द्वारा अपनी उपस्थिति दर्ज करें।",
					rule: "देरी या आपातकालीन अवकाश की स्थिति में टीम लीड को तुरंत सूचित करें।",
				},
				{
					area: "कार्यस्थल गरिमा",
					standard: "उचित वेशभूषा, शालीन भाषा एवं सम्मानजनक व्यवहार बनाए रखें।",
					rule: "किसी भी सहकर्मी के साथ अभद्र भाषा या अनुचित व्यवहार कतई बर्दाश्त नहीं।",
				},
				{
					area: "अवकाश प्रबंधन",
					standard: "नियोजित अवकाश के लिए कम से कम 48 घंटे पूर्व सिस्टम में आवेदन करें।",
					rule: "बिना सूचना 3 दिन से अधिक अनुपस्थित रहने पर नियमानुसार कार्रवाई होगी।",
				},
				{
					area: "कंपनी संपत्तियों की सुरक्षा",
					standard: "कंपनी द्वारा दिए गए लैपटॉप, फोन, बारकोड स्कैनर आदि को सुरक्षित रखें।",
					rule: "उपकरण के खोने या खराब होने की सूचना 12 घंटे में एचआर/आईटी को दें।",
				},
			],
		},
		sopSteps: {
			en: [
				{
					step: "Phase 1: Onboarding",
					action: "Submit statutory KYC documents (Aadhaar, PAN, Bank Passbook).",
					compliance: "Read and digitally sign the Evaluna Code of Conduct agreement.",
				},
				{
					step: "Phase 2: Daily Workflow",
					action: "Clock in upon arrival. Review assigned daily targets and team priorities.",
					compliance: "Wear company identification badge visibly throughout the shift.",
				},
				{
					step: "Phase 3: Payslip Verification",
					action: "Review monthly payslip on the employee portal on the 1st of each month.",
					compliance: "Report any discrepancy in allowances or deductions within 5 days.",
				},
				{
					step: "Phase 4: Grievance Escalation",
					action: "Submit concerns confidentially to the HR Ombudsperson via secure portal.",
					compliance: "All complaints are reviewed within 72 hours under strict anonymity.",
				},
			],
			hi: [
				{
					step: "चरण 1: जॉइनिंग एवं दस्तावेज",
					action: "वैधानिक केवाईसी (आधार, पैन, बैंक खाता विवरण) पोर्टल पर जमा करें।",
					compliance: "इवालूना आचार संहिता एवं नीति समझौते पर हस्ताक्षर अनिवार्य हैं।",
				},
				{
					step: "चरण 2: दैनिक कार्यप्रवाह",
					action: "समय पर उपस्थिति दर्ज करें और दिन के कार्यों की योजना बनाएं।",
					compliance: "कार्यस्थल पर कंपनी पहचान पत्र (आईडी कार्ड) पहनना अनिवार्य है।",
				},
				{
					step: "चरण 3: वेतन पर्ची मिलान",
					action: "प्रत्येक माह की 1 तारीख को पोर्टल पर अपनी सैलरी स्लिप की जांच करें।",
					compliance: "किसी भी विसंगति की सूचना 5 दिनों के भीतर एचआर विभाग को दें।",
				},
				{
					step: "चरण 4: शिकायत निवारण",
					action: "किसी भी समस्या की गोपनीय रिपोर्ट एचआर ग्रीवेंस डेस्क पर भेजें।",
					compliance: "सभी शिकायतों की 72 घंटों में निष्पक्ष व गोपनीय जांच की जाएगी।",
				},
			],
		},
		securityDirectives: {
			en: [
				"Employee salary data and personal contact information must remain strictly confidential.",
				"Zero tolerance for retaliation against whistleblowers or employees reporting ethical concerns.",
				"External press statements or public posts regarding company matters require corporate clearance.",
			],
			hi: [
				"कर्मचारियों का वेतन डेटा एवं व्यक्तिगत फोन नंबर पूर्णतः गोपनीय हैं।",
				"किसी भी शिकायतकर्ता के विरुद्ध बदले की भावना से की गई कार्रवाई दंडनीय है।",
				"सोशल मीडिया पर कंपनी मामलों संबंधी कोई भी बयान बिना अनुमति जारी न करें।",
			],
		},
	},

	"keyboard-shortcuts": {
		id: "keyboard-shortcuts",
		category: "quick-reference",
		title: {
			en: "Enterprise System Keyboard Shortcuts & Fast Access Guide",
			hi: "उद्यम प्रणाली कीबोर्ड शॉर्टकट एवं त्वरित उपयोग संदर्भ",
		},
		subtitle: {
			en: "Rapid Navigation, Countertop Speed & Ergonomic Operation Reference",
			hi: "द्रुत नेविगेशन, काउंटर गति संवर्धन एवं सुगम संचालन संदर्भ",
		},
		badge: {
			en: "Quick Reference",
			hi: "त्वरित संदर्भ",
		},
		summary: {
			en: "A cheat sheet of system keystrokes to maximize productivity across sales counters, warehouse dispatches, and accounting desks while maintaining transactional accuracy.",
			hi: "बिक्री काउंटरों, वेयरहाउस डिस्पैच एवं लेखा डेस्क पर कार्यक्षमता बढ़ाने हेतु अधिकृत शॉर्टकट कुंजियों की त्वरित संदर्भ सूची।",
		},
		ethicsHighlights: {
			en: [
				"Shortcuts exist to accelerate service, not to rush and skip customer verification.",
				"Always allow customers to verify the billed total before pressing finalize.",
				"Never use rapid keystrokes to bypass mandatory batch selection prompts.",
				"Keep keyboard hardware clean and report sticking or faulty keys immediately.",
			],
			hi: [
				"शॉर्टकट कार्य को सुगम बनाने हेतु हैं, ग्राहक सत्यापन जल्दबाजी में छोड़ने हेतु नहीं।",
				"अंतिम बिल बटन दबाने से पूर्व ग्राहक को कुल राशि अवश्य देखने दें।",
				"बैच चयन अथवा सुरक्षा निर्देशों को शॉर्टकट से बायपास न करें।",
				"कीबोर्ड को साफ रखें और खराब कुंजियों की सूचना तुरंत आईटी को दें।",
			],
		},
		responsibilities: {
			en: [
				{
					area: "Alt + P (POS Counter)",
					standard: "Direct jump to Point-of-Sale billing screen from any module.",
					rule: "Saves time during peak checkout queues.",
				},
				{
					area: "F2 / Ctrl + K (Global Search)",
					standard: "Instantly open command palette to search products, customers, or bills.",
					rule: "Use to rapidly locate product codes without leaving current window.",
				},
				{
					area: "Alt + B (Focus Barcode Input)",
					standard: "Puts keyboard focus directly into the active barcode scanner field.",
					rule: "Eliminates need for mouse clicking between item scans.",
				},
				{
					area: "Ctrl + Enter (Complete Sale)",
					standard: "Triggers payment modal and checkout confirmation.",
					rule: "Only press after customer tenders exact cash or confirms digital payment.",
				},
			],
			hi: [
				{
					area: "Alt + P (पीओएस काउंटर)",
					standard: "किसी भी मॉड्यूल से सीधे पॉइंट-ऑफ-सेल बिलिंग स्क्रीन पर जाएं।",
					rule: "भीड़ के समय बिलिंग प्रक्रिया को गति प्रदान करता है।",
				},
				{
					area: "F2 / Ctrl + K (सार्वभौमिक खोज)",
					standard: "उत्पाद, ग्राहक अथवा बिल खोजने हेतु कमांड पैलेट खोलें।",
					rule: "वर्तमान स्क्रीन छोड़े बिना तुरंत आइटम खोजने में सहायक।",
				},
				{
					area: "Alt + B (बारकोड फोकस)",
					standard: "कर्सर को तुरंत बारकोड स्कैनर इनपुट बॉक्स पर ले जाएं।",
					rule: "माउस क्लिक किए बिना लगातार स्कैनिंग जारी रखने में सहायक।",
				},
				{
					area: "Ctrl + Enter (बिल पूर्ण करें)",
					standard: "भुगतान विंडो खोलें और बिल सुरक्षित रूप से पूर्ण करें।",
					rule: "ग्राहक द्वारा भुगतान की पुष्टि के पश्चात ही इसका उपयोग करें।",
				},
			],
		},
		sopSteps: {
			en: [
				{
					step: "Navigation",
					action: "Press 'Ctrl + /' anywhere in the application to view contextual shortcut overlays.",
					compliance: "Works across all modern browsers and terminal displays.",
				},
				{
					step: "Table Pagination",
					action: "Use 'Page Up' and 'Page Down' or 'J' / 'K' keys to navigate large transaction tables.",
					compliance: "Reduces wrist strain and increases data inspection speed.",
				},
				{
					step: "Modal Controls",
					action: "Press 'Esc' to dismiss popups safely; 'Enter' to confirm highlighted action.",
					compliance: "Always read modal confirmation warnings before pressing Enter.",
				},
				{
					step: "Print Automation",
					action: "Press 'Ctrl + P' when invoice is displayed to trigger thermal or A4 print.",
					compliance: "Ensure printer paper roll is loaded and aligned before firing prints.",
				},
			],
			hi: [
				{
					step: "नेविगेशन",
					action: "सिस्टम में कहीं भी 'Ctrl + /' दबाकर प्रासंगिक शॉर्टकट सूची देखें।",
					compliance: "सभी आधुनिक ब्राउज़रों एवं टर्मिनलों पर सुचारू रूप से कार्य करता है।",
				},
				{
					step: "तालिका संचालन",
					action: "लंबी रिकॉर्ड सूची में आगे-पीछे जाने हेतु 'Page Up / Down' या 'J / K' का प्रयोग करें।",
					compliance: "माउस पर निर्भरता घटाता है और रिकॉर्ड जांच तेज करता है।",
				},
				{
					step: "डायलॉग नियंत्रण",
					action: "'Esc' से विंडो बंद करें; 'Enter' से चयनित विकल्प की पुष्टि करें।",
					compliance: "कन्फर्म करने से पहले चेतावनी संदेश को ध्यानपूर्वक पढ़ें।",
				},
				{
					step: "प्रिंट ऑटोमेशन",
					action: "चालान स्क्रीन पर 'Ctrl + P' दबाकर प्रिंटर पर कमांड भेजें।",
					compliance: "प्रिंट भेजने से पूर्व प्रिंटर में पेपर रोल ठीक से लगा होना सुनिश्चित करें।",
				},
			],
		},
		securityDirectives: {
			en: [
				"Never write or paste secret passwords or authentication tokens using automated macro keys.",
				"Lock terminal immediately with 'Windows Key + L' or system logout when stepping away.",
				"Report non-responsive keys or accidental repeat inputs to IT immediately.",
			],
			hi: [
				"मैक्रो अथवा शॉर्टकट कुंजियों में गुप्त पासवर्ड कभी सेव न करें।",
				"सीट से उठते समय 'Windows + L' या सिस्टम लॉगआउट कर स्क्रीन लॉक अवश्य करें।",
				"कीबोर्ड में कोई बटन फंसने अथवा दोहरा इनपुट होने पर आईटी को सूचित करें।",
			],
		},
	},

	"common-workflows": {
		id: "common-workflows",
		category: "quick-reference",
		title: {
			en: "Common Daily Workflows & Standard Operating Procedures",
			hi: "दैनिक व्यावसायिक कार्यप्रवाह एवं मानक संचालन प्रक्रिया (SOP)",
		},
		subtitle: {
			en: "Step-by-Step Blueprint for Store Opening, Sales Auditing, Stock Movement & Closing",
			hi: "स्टोर उद्घाटन, बिक्री ऑडिट, स्टॉक स्थानांतरण एवं दैनिक क्लोजिंग हेतु चरणबद्ध रूपरेखा",
		},
		badge: {
			en: "Quick Reference",
			hi: "त्वरित संदर्भ",
		},
		summary: {
			en: "A comprehensive guide outlining routine operational workflows across all retail branches and distribution hubs, ensuring smooth inter-departmental harmony and accountability.",
			hi: "सभी खुदरा शाखाओं एवं वितरण केंद्रों में नियमित व्यावसायिक प्रक्रियाओं की मार्गदर्शिका, जो विभागीय समन्वय एवं जवाबदेही सुनिश्चित करती है।",
		},
		ethicsHighlights: {
			en: [
				"Timely execution of morning checklist prevents checkout delays for patrons.",
				"Stock transfers between branches must be signed off by both sender and recipient.",
				"Day-end cash reconciliations must be witnessed by a minimum of two employees.",
				"Immediate logging of any customer return, refund, or exchange transaction.",
			],
			hi: [
				"सुबह की चेकलिस्ट समय पर पूरी करने से ग्राहकों को कतार में प्रतीक्षा नहीं करनी पड़ती।",
				"शाखाओं के बीच माल स्थानांतरण पर भेजने वाले एवं प्राप्तकर्ता दोनों के हस्ताक्षर अनिवार्य।",
				"दिन के अंत में नकद मिलान कम से कम दो कर्मचारियों की उपस्थिति में होना चाहिए।",
				"ग्राहक वापसी, रिफंड या एक्सचेंज की प्रविष्टि तुरंत सिस्टम में दर्ज करें।",
			],
		},
		responsibilities: {
			en: [
				{
					area: "Morning Opening",
					standard: "Power on hardware, verify internet/offline cache, balance cash drawer.",
					rule: "Must be completed at least 20 minutes before store doors open.",
				},
				{
					area: "Mid-Day Restock",
					standard: "Transfer depleted shelf items from backroom with system transfer slips.",
					rule: "Never move products without scanning source and destination bins.",
				},
				{
					area: "Inter-Branch Transfer",
					standard: "Create delivery challan and dispatch with tracked transporter.",
					rule: "Receiving branch must confirm receipt within 4 business hours.",
				},
				{
					area: "Evening Closing (EOD)",
					standard: "Generate Daily Sales Summary, match cash/UPI with physical safe.",
					rule: "No employee may depart until EOD report is signed and archived.",
				},
			],
			hi: [
				{
					area: "सुबह स्टोर उद्घाटन",
					standard: "सिस्टम चालू करें, इंटरनेट व ऑफलाइन कैश जांचें, ड्रावर राशि गिनें।",
					rule: "दुकान खुलने से कम से कम 20 मिनट पूर्व यह प्रक्रिया पूरी होनी चाहिए।",
				},
				{
					area: "दोपहर स्टॉक पुनःपूर्ति",
					standard: "गोदाम से काउंटर तक माल सिस्टम ट्रांसफर स्लिप के साथ लाएं।",
					rule: "बिना स्रोत एवं गंतव्य स्कैन किए माल की आवाजाही न करें।",
				},
				{
					area: "अंतर-शाखा स्थानांतरण",
					standard: "चालान जनरेट करें और अधिकृत वाहन द्वारा माल भेजें।",
					rule: "प्राप्तकर्ता शाखा 4 घंटे के भीतर पोर्टल पर प्राप्ति की पुष्टि करे।",
				},
				{
					area: "शाम की क्लोजिंग (EOD)",
					standard: "दैनिक बिक्री रिपोर्ट निकालें, नकद व यूपीआई का तिजोरी से मिलान करें।",
					rule: "क्लोजिंग रिपोर्ट पर हस्ताक्षर व सुरक्षित फाइलिंग के बाद ही प्रस्थान करें।",
				},
			],
		},
		sopSteps: {
			en: [
				{
					step: "09:00 AM - Check-In",
					action: "Perform biometric punch. Open POS terminal. Run barcode scanner test.",
					compliance: "Report any hardware error code before first patron arrives.",
				},
				{
					step: "01:00 PM - Audit Check",
					action: "Count high-value cash notes and deposit excess into drop safe.",
					compliance: "Prevents accumulated cash exposure on active sales counters.",
				},
				{
					step: "06:00 PM - Dispatch Review",
					action: "Ensure all pending customer delivery dispatches are handed to drivers.",
					compliance: "Verify driver receipt and manifest signatures.",
				},
				{
					step: "09:30 PM - Shift Reconciliation",
					action: "Print EOD Z-Report. Secure cash in vault. Shut down peripheral devices.",
					compliance: "Submit daily digital summary to Regional Operations Lead.",
				},
			],
			hi: [
				{
					step: "प्रातः 09:00 - चेक-इन",
					action: "बायोमेट्रिक लगाएं। सिस्टम खोलें। बारकोड स्कैनर का परीक्षण करें।",
					compliance: "पहले ग्राहक के आने से पूर्व किसी भी तकनीकी खराबी को दूर करें।",
				},
				{
					step: "दोपहर 01:00 - सुरक्षा जांच",
					action: "अतिरिक्त नकद राशि की गिनती कर उसे तिजोरी में जमा करें।",
					compliance: "काउंटर पर अत्यधिक नकद जमा होने के जोखिम को कम करता है।",
				},
				{
					step: "सायं 06:00 - डिस्पैच समीक्षा",
					action: "सुनिश्चित करें कि सभी डिलीवरी ऑर्डर चालकों को सौंप दिए गए हैं।",
					compliance: "चालान पर ड्राइवर के हस्ताक्षर व वाहन नंबर की पुष्टि करें।",
				},
				{
					step: "रात्रि 09:30 - दैनिक क्लोजिंग",
					action: "दैनिक जेड-रिपोर्ट निकालें, कैश सुरक्षित करें, उपकरण बंद करें।",
					compliance: "क्षेत्रीय प्रबंधक को दैनिक सारांश रिपोर्ट प्रेषित करें।",
				},
			],
		},
		securityDirectives: {
			en: [
				"Always lock safe immediately after deposits; never leave safe doors unmonitored.",
				"All keyholders are personally accountable for physical premises security.",
				"Emergency contact list must be posted visibly next to the store telephone.",
			],
			hi: [
				"कैश जमा करने के तुरंत बाद तिजोरी लॉक करें; तिजोरी कभी खुली न छोड़ें।",
				"चाबी धारक कर्मचारी परिसर की भौतिक सुरक्षा हेतु व्यक्तिगत रूप से जिम्मेदार हैं।",
				"आपातकालीन संपर्क नंबर फोन के समीप दीवार पर चस्पा होने चाहिए।",
			],
		},
	},

	"error-codes": {
		id: "error-codes",
		category: "quick-reference",
		title: {
			en: "System Error Codes & Operational Troubleshooting Manual",
			hi: "सिस्टम त्रुटि कोड एवं त्वरित समस्या निवारण संदर्भ",
		},
		subtitle: {
			en: "Clear Diagnostic Meanings, User-Level Fixes & Safe IT Escalation Procedures",
			hi: "स्पष्ट निदान अर्थ, उपयोगकर्ता स्तर समाधान एवं सुरक्षित आईटी एस्केलेशन प्रक्रिया",
		},
		badge: {
			en: "Quick Reference",
			hi: "त्वरित संदर्भ",
		},
		summary: {
			en: "Provides an exhaustive catalog of front-end and operational error codes encountered in Evaluna ERP, detailing how floor staff can resolve them safely without compromising system security.",
			hi: "इवालूना ईआरपी में आने वाले सामान्य त्रुटि कोडों की संपूर्ण सूची, जो बताती है कि कर्मचारी बिना सिस्टम सुरक्षा से समझौता किए उनका सुरक्षित समाधान कैसे कर सकते हैं।",
		},
		ethicsHighlights: {
			en: [
				"Never attempt unauthorized workarounds or SQL script tampering to bypass errors.",
				"Always note the exact error code and timestamp before contacting IT Support.",
				"Do not power cycle database servers or disconnect cables during active sync operations.",
				"Protect customer composure during technical glitches; explain situation politely.",
			],
			hi: [
				"त्रुटि हटाने हेतु अनाधिकृत तरीके अथवा सिस्टम से छेड़छाड़ का प्रयास कभी न करें।",
				"आईटी सपोर्ट को कॉल करने से पूर्व स्क्रीन पर दिख रहा कोड और समय नोट करें।",
				"डेटा सिंक के दौरान कंप्यूटर बंद न करें और न ही केबल निकालें।",
				"तकनीकी रुकावट के समय ग्राहक के साथ शांत एवं विनम्रतापूर्वक संवाद करें।",
			],
		},
		responsibilities: {
			en: [
				{
					area: "ERR_SYNC_101 (Offline Cache)",
					standard: "Local browser database is operating in offline mode. Bills queued locally.",
					rule: "Continue billing offline; data will auto-sync when connection restores.",
				},
				{
					area: "ERR_BARCODE_204 (Unmapped SKU)",
					standard: "Scanned barcode is not found in the current branch price book.",
					rule: "Place item aside; do not guess price or punch random item codes.",
				},
				{
					area: "ERR_STOCK_409 (Negative Inventory)",
					standard: "Requested quantity exceeds verified physical balance in bin.",
					rule: "Request floor lead to inspect physical bin and authorize stock adjustment.",
				},
				{
					area: "ERR_PRINTER_502 (Device Timeout)",
					standard: "Thermal receipt printer is disconnected, out of paper, or jammed.",
					rule: "Check paper roll and USB cable connection before re-triggering print.",
				},
			],
			hi: [
				{
					area: "ERR_SYNC_101 (ऑफलाइन कैश)",
					standard: "इंटरनेट न होने से बिल ऑफलाइन सुरक्षित हो रहे हैं।",
					rule: "बिलिंग जारी रखें; इंटरनेट आने पर डेटा स्वतः सिंक हो जाएगा।",
				},
				{
					area: "ERR_BARCODE_204 (अनमैप्ड कोड)",
					standard: "स्कैन किया गया बारकोड मूल्य सूची में उपलब्ध नहीं है।",
					rule: "सामग्री को अलग रखें; अनुमान से कोई अन्य कोड न डालें।",
				},
				{
					area: "ERR_STOCK_409 (स्टॉक अनुपलब्ध)",
					standard: "मांगी गई मात्रा सिस्टम में दर्ज उपलब्ध स्टॉक से अधिक है।",
					rule: "सुपरवाइजर से भौतिक स्टॉक जांचने एवं समायोजन हेतु कहें।",
				},
				{
					area: "ERR_PRINTER_502 (प्रिंटर रुकावट)",
					standard: "रसीद प्रिंटर ऑफलाइन है, कागज खत्म है या पेपर अटक गया है।",
					rule: "कागज का रोल एवं केबल जांचने के बाद पुनः प्रिंट कमांड दें।",
				},
			],
		},
		sopSteps: {
			en: [
				{
					step: "Step 1: Read the Code",
					action: "Observe the dialog banner. Identify the prefix (SYNC, BARCODE, STOCK, PRINTER).",
					compliance: "Take a screenshot or photograph of the code if it persists.",
				},
				{
					step: "Step 2: Check Physical Basics",
					action: "Inspect LAN cable connection, Wi-Fi status, and device power lights.",
					compliance: "85% of issues resolve with proper cable seating.",
				},
				{
					step: "Step 3: Refresh Cache",
					action: "Press 'Ctrl + F5' to hard-reload web application assets safely.",
					compliance: "Pending offline transactions in Dexie storage remain preserved.",
				},
				{
					step: "Step 4: Contact Helpdesk",
					action: "Call internal IT extension 1500 or email support@evaluna.com with branch ID.",
					compliance: "IT technicians will resolve priority tickets within 15 minutes.",
				},
			],
			hi: [
				{
					step: "कदम 1: कोड पढ़ें",
					action: "स्क्रीन पर आ रहे कोड का अक्षर देखें (जैसे SYNC, BARCODE, STOCK)।",
					compliance: "समस्या लगातार आने पर स्क्रीन की फोटो या स्क्रीनशॉट लें।",
				},
				{
					step: "कदम 2: केबल व इंटरनेट जांच",
					action: "इंटरनेट केबल, वाई-फाई और प्रिंटर की पावर लाइट की जांच करें।",
					compliance: "अधिकांश समस्याएं केबल ठीक से लगाने पर हल हो जाती हैं।",
				},
				{
					step: "कदम 3: पेज रिफ्रेश",
					action: "'Ctrl + F5' दबाकर पेज को सुरक्षित रूप से पुनः लोड करें।",
					compliance: "ऑफलाइन सुरक्षित किए गए बिल नष्ट नहीं होते, सुरक्षित रहते हैं।",
				},
				{
					step: "कदम 4: हेल्पडेस्क संपर्क",
					action: "आईटी एक्सटेंशन 1500 पर कॉल करें या support@evaluna.com पर लिखें।",
					compliance: "आईटी टीम प्राथमिकता के आधार पर शीघ्र समाधान प्रदान करेगी।",
				},
			],
		},
		securityDirectives: {
			en: [
				"Never share server administration passwords over phone or non-official channels.",
				"Only certified Evaluna IT engineers may install remote desktop assistance software.",
				"Keep all antivirus definitions and system security patches updated.",
			],
			hi: [
				"फोन अथवा व्हाट्सएप पर सर्वर पासवर्ड कभी किसी को न बताएं।",
				"केवल अधिकृत आईटी इंजीनियरों को ही रिमोट एक्सेस की अनुमति दें।",
				"सिस्टम सुरक्षा पैच और एंटीवायरस को सदैव अपडेट रखें।",
			],
		},
	},

	"data-entry": {
		id: "data-entry",
		category: "quick-reference",
		title: {
			en: "Data Entry Standards, Quality Control & Integrity Tips",
			hi: "डेटा प्रविष्टि मानक, गुणवत्ता नियंत्रण एवं शुचिता दिशानिर्देश",
		},
		subtitle: {
			en: "Maintaining Zero-Error Master Data, Proper Naming Formats & Compliance",
			hi: "त्रुटि-रहित मास्टर डेटा, मानक नामकरण प्रारूप एवं शुद्धता रखरखाव",
		},
		badge: {
			en: "Quick Reference",
			hi: "त्वरित संदर्भ",
		},
		summary: {
			en: "Guidelines for accurately keying in customer masters, supplier records, SKU titles, tax identifiers, and phone numbers to keep enterprise reports clean and legally compliant.",
			hi: "ग्राहक मास्टर, विक्रेता रिकॉर्ड, उत्पाद शीर्षक, टैक्स नंबर एवं पते की सही प्रविष्टि हेतु दिशानिर्देश, जो रिपोर्ट्स को सटीक एवं कानूनी रूप से मान्य रखते हैं।",
		},
		ethicsHighlights: {
			en: [
				"Zero placeholder or dummy information in live production databases.",
				"Mandatory verification of customer phone numbers and GSTIN before saving records.",
				"Standardized title case formatting for customer names and product titles.",
				"Respect for customer contact preferences: opt-in required for SMS/promotional alerts.",
			],
			hi: [
				"लाइव डेटाबेस में डमी अथवा फर्जी जानकारी दर्ज करना सख्त मना है।",
				"ग्राहक का फोन नंबर एवं जीएसटी नंबर सत्यापित करके ही सुरक्षित करें।",
				"ग्राहकों के नाम एवं उत्पादों के शीर्षक सही व्याकरण व बड़े-छोटे अक्षरों में लिखें।",
				"ग्राहक की गोपनीयता का आदर करें: प्रचार संदेश हेतु उनकी सहमति आवश्यक है।",
			],
		},
		responsibilities: {
			en: [
				{
					area: "Customer Name",
					standard: "Enter full legal name in Title Case (e.g., 'Rajesh Sharma').",
					rule: "Avoid abbreviations, honorifics (Mr/Shri), or nicknames in primary field.",
				},
				{
					area: "Phone Number",
					standard: "Record 10-digit mobile number without leading 0 or +91 prefix.",
					rule: "System automatically validates valid Indian telecom prefixes (6, 7, 8, 9).",
				},
				{
					area: "GSTIN Identification",
					standard: "Format: 2-digit state code + 10-digit PAN + 1-digit entity + Z + check char.",
					rule: "Always verify state code matches delivery address state.",
				},
				{
					area: "Product Titles (SKU)",
					standard: "Brand + Product Name + Variant/Weight (e.g., 'Evaluna Whole Wheat Flour 5kg').",
					rule: "Enables unambiguous search results and accurate warehouse picks.",
				},
			],
			hi: [
				{
					area: "ग्राहक का नाम",
					standard: "पूरा नाम उचित अक्षरों में लिखें (उदा. 'राजेश शर्मा')।",
					rule: "मुख्य नाम के साथ उपनाम या श्री/महोदय जैसी उपाधियां न जोड़ें।",
				},
				{
					area: "मोबाइल नंबर",
					standard: "बिना 0 या +91 लगाए 10 अंकों का मान्य भारतीय मोबाइल नंबर लिखें।",
					rule: "सिस्टम स्वतः भारतीय मोबाइल नंबर की वैधता की पुष्टि करता है।",
				},
				{
					area: "जीएसटी नंबर (GSTIN)",
					standard: "15 अंकों का निर्धारित प्रारूप: राज्य कोड + पैन नंबर + इकाई कोड + Z + कोड।",
					rule: "सुनिश्चित करें कि राज्य कोड डिलीवरी पते से मेल खाता हो।",
				},
				{
					area: "उत्पाद शीर्षक (SKU)",
					standard: "ब्रांड + उत्पाद नाम + वजन/मात्रा (उदा. 'इवालूना गेहूं आटा 5 किग्रा')।",
					rule: "सर्च करने में सुगमता एवं वेयरहाउस में सही माल चयन सुनिश्चित करता है।",
				},
			],
		},
		sopSteps: {
			en: [
				{
					step: "Rule 1: Double-Check Input",
					action: "Review telephone and GSTIN digits carefully before hitting 'Save'.",
					compliance: "Prevents tax credit disallowances and undelivered invoices.",
				},
				{
					step: "Rule 2: Complete Address Fields",
					action: "Fill in Street, Landmark, City (Bhopal/Berasia), State, and 6-digit Pincode.",
					compliance: "Ensures logistics routing algorithms calculate optimal transport costs.",
				},
				{
					step: "Rule 3: Avoid Duplicate Records",
					action: "Always search by phone number or PAN before creating a new customer account.",
					compliance: "Maintains consolidated purchase loyalty points for patrons.",
				},
				{
					step: "Rule 4: Review Warning Prompts",
					action: "If system flags an existing similar record, verify whether to merge or separate.",
					compliance: "Prevents database bloating and redundant ledger accounts.",
				},
			],
			hi: [
				{
					step: "नियम 1: दोबारा जांचें",
					action: "'सुरक्षित करें' दबाने से पहले फोन नंबर और जीएसटी के अंकों को दोबारा पढ़ें।",
					compliance: "गलत इनपुट से ग्राहक को इनपुट टैक्स क्रेडिट मिलने में बाधा आती है।",
				},
				{
					step: "नियम 2: पूरा पता भरें",
					action: "सड़क, लैंडमार्क, शहर (भोपाल/बैरसिया), राज्य एवं 6 अंकों का पिनकोड लिखें।",
					compliance: "सामान की समय पर एवं सही पते पर डिलीवरी सुनिश्चित करता है।",
				},
				{
					step: "नियम 3: डुप्लीकेट से बचें",
					action: "नया खाता बनाने से पूर्व हमेशा फोन नंबर या पैन से खोजें।",
					compliance: "ग्राहक के सभी बिल और लॉयल्टी अंक एक ही खाते में जुड़ते हैं।",
				},
				{
					step: "नियम 4: चेतावनी संदेश देखें",
					action: "यदि सिस्टम मिलता-जुलता रिकॉर्ड दिखाए, तो पुष्टि करके ही आगे बढ़ें।",
					compliance: "डेटाबेस में अनावश्यक खातों की भरमार से बचाता है।",
				},
			],
		},
		securityDirectives: {
			en: [
				"Customer address and financial data must never be exported to personal thumb drives or email.",
				"All modifications to customer master records are logged with employee user ID and timestamp.",
				"Report suspected identity fraud or fabricated GST numbers immediately to Corporate Compliance.",
			],
			hi: [
				"ग्राहक का पता या वित्तीय डेटा कभी भी निजी ईमेल या पेनड्राइव में न निकालें।",
				"मास्टर डेटा में प्रत्येक बदलाव कर्मचारी की यूजर आईडी व समय के साथ दर्ज होता है।",
				"किसी भी फर्जी जीएसटी अथवा संदिग्ध विवरण की सूचना अनुपालन अधिकारी को दें।",
			],
		},
	},
	"system-overview": {
		id: "system-overview",
		category: "department",
		title: {
			en: "Evaluna ERP Architecture & System Overview Manual",
			hi: "इवालूना ईआरपी आर्किटेक्चर एवं सिस्टम अवलोकन नियमावली",
		},
		subtitle: {
			en: "Complete Enterprise Architectural Blueprint, Offline Resilience & Modular Hierarchy",
			hi: "संपूर्ण एंटरप्राइज आर्किटेक्चर ब्लूप्रिंट, ऑफलाइन सहनशीलता एवं मॉड्यूलर पदानुक्रम",
		},
		badge: {
			en: "Architecture Guide",
			hi: "आर्किटेक्चर गाइड",
		},
		summary: {
			en: "A comprehensive guide to Evaluna ERP architecture, high-availability data flow, role-based security barriers, and offline-first synchronization protocols across all operational modules.",
			hi: "इवालूना ईआरपी की तकनीकी संरचना, उच्च-उपलब्धता डेटा प्रवाह, भूमिका-आधारित सुरक्षा और ऑफलाइन-प्रथम सिंक्रोनाइज़ेशन का व्यापक मार्गदर्शक विवरण।",
		},
		ethicsHighlights: {
			en: [
				"Deterministic audit logs recording all balance sheet entries and inventory shifts.",
				"Zero unauthorized data tampering; ledger entries are immutable once approved.",
				"Multi-tier encryption for customer identifiable records and financial summaries.",
				"Strict adherence to least-privilege security principle across all dashboards.",
			],
			hi: [
				"लेखा-जोखा और स्टॉक में प्रत्येक बदलाव का अपरिवर्तनीय ऑडिट ट्रेल।",
				"मंजूरी के उपरांत वित्तीय प्रविष्टियों में अनधिकृत फेरबदल की पूर्ण मनाही।",
				"ग्राहक डेटा एवं वित्तीय सारांश पर बहुस्तरीय एन्क्रिप्शन सुरक्षा।",
				"सभी डैशबोर्ड्स पर न्यूनतम विशेषाधिकार सुरक्षा सिद्धांत का कड़ाई से पालन।",
			],
		},
		responsibilities: {
			en: [
				{
					area: "Core Engine & Database",
					standard: "Maintains real-time consistency with localized SQLite caching.",
					rule: "Never bypass application transactions with unverified raw SQL scripts.",
				},
				{
					area: "Authentication & RBAC",
					standard: "Validates cryptographic sessions and role authorizations per request.",
					rule: "Session credentials must never be shared across concurrent staff members.",
				},
				{
					area: "Hardware Integration",
					standard: "Direct thermal printer ESC/POS and 2D barcode scanner connectivity.",
					rule: "Verify peripheral drivers before commencing high-volume daily shifts.",
				},
				{
					area: "Disaster Recovery",
					standard: "Automated incremental offsite snapshots and ledger verification.",
					rule: "Test rollback and synchronization integrity on scheduled audit cycles.",
				},
			],
			hi: [
				{
					area: "मुख्य इंजन एवं डेटाबेस",
					standard: "स्थानीय SQLite कैशिंग के साथ रीयल-टाइम डेटा संतुलन बनाए रखना।",
					rule: "बिना जांचे कच्चे SQL स्क्रिप्ट द्वारा सीधे डेटाबेस में छेड़छाड़ न करें।",
				},
				{
					area: "सत्यापन एवं भूमिका नियंत्रण",
					standard: "प्रत्येक अनुरोध पर उपयोगकर्ता की भूमिका एवं डिजिटल सत्र की पुष्टि।",
					rule: "लॉगिन क्रेडेंशियल्स को अन्य कर्मचारियों के साथ कभी साझा न करें।",
				},
				{
					area: "हार्डवेयर एकीकरण",
					standard: "थर्मल प्रिंटर और 2D बारकोड स्कैनर के साथ सीधा निर्बाध कनेक्शन।",
					rule: "दैनिक बिक्री प्रारंभ करने से पूर्व प्रिंटर और स्कैनर की जांच अनिवार्य है।",
				},
				{
					area: "आपदा प्रबंधन एवं बैकअप",
					standard: "नियमित अंतराल पर सुरक्षित बैकअप और ऑडिट संतुलन का सत्यापन।",
					rule: "निर्धारित समय चक्र पर बैकअप रिकवरी और डेटा मिलान की जांच करें।",
				},
			],
		},
		sopSteps: {
			en: [
				{
					step: "Phase 1: Environment Boot",
					action: "Initialize client database caches and authenticate station master token.",
					compliance: "Prevents unauthorized terminals from accessing company ledger.",
				},
				{
					step: "Phase 2: Service Health Check",
					action: "Ping regional sync endpoint (Bhopal/Berasia cloud gateway).",
					compliance: "Establishes online/offline operating status seamlessly.",
				},
				{
					step: "Phase 3: Module Activation",
					action: "Load role-designated interfaces (POS, Inventory, Finance, or HR).",
					compliance: "Enforces compartmentalized privilege boundaries.",
				},
				{
					step: "Phase 4: Delta Sync",
					action: "Synchronize pending transactions and pull recent catalogue updates.",
					compliance: "Guarantees unified inventory figures across branches.",
				},
			],
			hi: [
				{
					step: "चरण 1: सिस्टम शुरुआत",
					action: "स्थानीय कैश डेटाबेस प्रारंभ करें और अधिकृत स्टेशन टोकन सत्यापित करें।",
					compliance: "अनाधिकृत कंप्यूटरों को मुख्य डेटाबेस से दूर रखता है।",
				},
				{
					step: "चरण 2: नेटवर्क स्वास्थ्य जांच",
					action: "केंद्रीय गेटवे (भोपाल/बैरसिया सर्वर) के साथ कनेक्टिविटी जांचें।",
					compliance: "ऑनलाइन अथवा ऑफलाइन संचालन मोड का तुरंत निर्धारण करता है।",
				},
				{
					step: "चरण 3: मॉड्यूल लोडिंग",
					action: "कर्मचारी की भूमिका के अनुसार अधिकृत डैशबोर्ड (पीओएस, स्टॉक आदि) खोलें।",
					compliance: "सुरक्षा सीमाओं और अधिकारों का कड़ाई से पालन सुनिश्चित करता है।",
				},
				{
					step: "चरण 4: डेटा सिंक्रोनाइज़ेशन",
					action: "लंबित लेन-देन अपलोड करें और नए उत्पादों की सूची डाउनलोड करें।",
					compliance: "सभी शाखाओं में स्टॉक की सही व एकसमान संख्या सुनिश्चित करता है।",
				},
			],
		},
		securityDirectives: {
			en: [
				"All client requests authenticate via signed session tokens with origin validation.",
				"Automated rate-limiting shields financial APIs from credential stuffing and scraping.",
				"Production database access is strictly restricted to senior infrastructure staff.",
			],
			hi: [
				"सभी अनुरोध डिजिटल हस्ताक्षर और वैध सत्र टोकन के माध्यम से जांचे जाते हैं।",
				"रेट-लिमिटिंग सुरक्षा वित्तीय डेटा को बाहरी हमलों से सुरक्षित रखती है।",
				"मुख्य डेटाबेस का नियंत्रण केवल अधिकृत तकनीकी प्रशासकों के पास रहता है।",
			],
		},
	},
	"quick-start-guide": {
		id: "quick-start-guide",
		category: "department",
		title: {
			en: "Dashboard Quick Start Guide & Operations SOP",
			hi: "डैशबोर्ड क्विक स्टार्ट गाइड एवं संचालन नियमावली",
		},
		subtitle: {
			en: "Step-by-Step Operator Onboarding: First-Time Login, Navigation & Daily Workflows",
			hi: "ऑपरेटर ऑनबोर्डिंग: प्रथम लॉगिन, डैशबोर्ड नेविगेशन एवं दैनिक कार्यप्रवाह",
		},
		badge: {
			en: "Operator Guide",
			hi: "ऑपरेटर गाइड",
		},
		summary: {
			en: "An essential operator handbook walking through dashboard setup, first login, shift initialization, shortcuts, and daily operational best practices across Evaluna ERP.",
			hi: "डैशबोर्ड सेटअप, प्रथम लॉगिन, शिफ्ट शुरुआत, शॉर्टकट कुंजी और दैनिक संचालन की श्रेष्ठ कार्यप्रणालियों की संपूर्ण मार्गदर्शिका।",
		},
		ethicsHighlights: {
			en: [
				"Daily lock-down of active terminal before leaving designated workstations.",
				"Complete transparency when counting and verifying physical opening till cash.",
				"Prompt notification to branch manager upon discovering discrepancy or barcode error.",
				"Polite and attentive assistance to all store customers and suppliers.",
			],
			hi: [
				"कार्यस्थल छोड़ने से पूर्व कंप्यूटर टर्मिनल को लॉक करना अनिवार्य।",
				"शिफ्ट की शुरुआत में शुरुआती नकदी की निष्पक्ष एवं सटीक गिनती।",
				"बारकोड अथवा बिलिंग त्रुटि दिखने पर तुरंत शाखा प्रबंधक को सूचित करना।",
				"सभी ग्राहकों और आपूर्तिकर्ताओं के साथ शालीन और निष्पक्ष व्यवहार।",
			],
		},
		responsibilities: {
			en: [
				{
					area: "Station Setup",
					standard: "Verify thermal receipt paper roll and barcode scanner cable seating.",
					rule: "Never yank printer cables or operate equipment with wet hands.",
				},
				{
					area: "Daily Opening",
					standard: "Perform initial cash drawer float count and submit digital opening slip.",
					rule: "Discrepancies in float must be logged prior to the first sale.",
				},
				{
					area: "Customer Care",
					standard: "Offer printed or WhatsApp receipt with every finalized checkout transaction.",
					rule: "Never ask customers for confidential UPI PINs or card CVVs.",
				},
				{
					area: "Shift Handover",
					standard: "Print shift settlement report and cross-verify actual drawer currency.",
					rule: "Handover requires co-signatures of both outgoing and incoming cashiers.",
				},
			],
			hi: [
				{
					area: "स्टेशन सेटअप",
					standard: "प्रिंटर में पेपर रोल और बारकोड स्कैनर की केबल की जांच करें।",
					rule: "गीले हाथों से उपकरण न छुएं और तारों को कभी जोर से न खींचें।",
				},
				{
					area: "दैनिक शुरुआत",
					standard: "शुरुआती कैश दराज राशि गिनें और डिजिटल ओपनिंग स्लिप जमा करें।",
					rule: "शुरुआती नकदी में अंतर होने पर पहली बिक्री से पहले रिपोर्ट करें।",
				},
				{
					area: "ग्राहक सेवा",
					standard: "प्रत्येक बिल के बाद ग्राहक को पक्की रसीद या व्हाट्सएप बिल प्रदान करें।",
					rule: "ग्राहक से उनका गोपनीय यूपीआई पिन या कार्ड सीवीवी कभी न पूछें।",
				},
				{
					area: "शिफ्ट हस्तांतरण",
					standard: "शिफ्ट समाप्ति रिपोर्ट निकालें और दराज के नकद से मिलान करें।",
					rule: "शिफ्ट हैंडओवर पर दोनों कैशियरों के डिजिटल हस्ताक्षर अनिवार्य हैं।",
				},
			],
		},
		sopSteps: {
			en: [
				{
					step: "Step 1: Sign In",
					action: "Navigate to /login, input corporate email/ID and authenticate via password.",
					compliance: "Never save passwords in public shared browser profile.",
				},
				{
					step: "Step 2: Role Landing",
					action: "Dashboard automatically loads your branch workspace and assigned duties.",
					compliance: "Verify that assigned branch location matches your physical depot.",
				},
				{
					step: "Step 3: Begin Workflow",
					action: "Open POS counter or warehouse receiving queue using top navigation shortcut.",
					compliance: "Ensure camera/scanner permissions are granted for barcode entry.",
				},
				{
					step: "Step 4: Shift Closure",
					action: "Submit day-end reconciliation report and log out securely.",
					compliance: "Never leave an active unlocked session unattended.",
				},
			],
			hi: [
				{
					step: "चरण 1: साइन इन",
					action: "/login पर जाएं, अपनी आईडी व पासवर्ड दर्ज कर सुरक्षित लॉगिन करें।",
					compliance: "साझा कंप्यूटर ब्राउज़र में पासवर्ड कभी सेव न करें।",
				},
				{
					step: "चरण 2: डैशबोर्ड पहुंच",
					action: "सिस्टम आपकी शाखा और जिम्मेदारियों के अनुसार डैशबोर्ड खोलेगा।",
					compliance: "जांचें कि प्रदर्शित शाखा आपके कार्यस्थल से मेल खाती है।",
				},
				{
					step: "चरण 3: कार्य प्रारंभ",
					action: "नेविगेशन बार से पीओएस काउंटर या स्टॉक इनवर्ड सूची खोलें।",
					compliance: "बारकोड स्कैनिंग हेतु स्कैनर अनुमति चालू रखें।",
				},
				{
					step: "चरण 4: शिफ्ट समापन",
					action: "दिन के अंत की रसीद बनाएं, नकद मिलान करें और लॉगआउट करें।",
					compliance: "खुले कंप्यूटर को बिना लॉक किए कभी अकेला न छोड़ें।",
				},
			],
		},
		securityDirectives: {
			en: [
				"Operators must lock screen (Win + L) when away from cash desk.",
				"Immediately report suspicious returns or unbilled stock clearances to security.",
				"All transactions include cryptographic audit timestamps that cannot be erased.",
			],
			hi: [
				"काउंटर से दूर जाते समय स्क्रीन लॉक (Win + L) करना अनिवार्य है।",
				"बिना बिल के माल ले जाने की किसी भी कोशिश की सूचना सुरक्षा दल को दें।",
				"सभी लेन-देन में मिटाए न जा सकने वाले डिजिटल टाइमस्टैम्प दर्ज होते हैं।",
			],
		},
	},
};
