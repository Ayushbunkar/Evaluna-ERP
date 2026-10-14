/**
 * Customer Support AI Agent Orchestrator
 * Integrates Groq LLM inference with authoritative ERP database context.
 * Strict customer-facing terminology: no internal slash routes or operational department leaks.
 */

import {
	type AuthenticCustomerContext,
	fetchCustomerAuthContext,
	OFFICIAL_COMPANY_INFO,
} from "./customer-support-data";
import { type ChatMessage, generateGroqCompletion } from "./groq";

export interface AgentRunParams {
	sessionId: number;
	userUid: string;
	userEmail?: string | null;
	userName?: string | null;
	userRole?: string | null;
	customerId?: number | null;
	content: string;
	conversationHistory?: Array<{ sender: string; content: string }>;
}

export interface AgentResponse {
	text: string;
	modelUsed: string;
	escalated?: boolean;
	metadata?: Record<string, any>;
}

export async function processCustomerSupportQuery({
	sessionId,
	userUid,
	userEmail,
	userName,
	userRole,
	customerId,
	content,
	conversationHistory = [],
}: AgentRunParams): Promise<AgentResponse> {
	// 1. Fetch real context from DB for this authenticated customer
	const context: AuthenticCustomerContext = await fetchCustomerAuthContext(
		userUid,
		userEmail,
		customerId,
	);

	// 2. Build Grounded System Prompt
	const ordersContextStr =
		context.recentOrders.length > 0
			? context.recentOrders
					.map((o) => {
						const itemsStr = o.items
							.map((i) => `${i.name} (Qty: ${i.quantity}, Price: ₹${i.price})`)
							.join(", ");
						const f = o.fulfillment;
						return `- Order #${o.orderId}: Date: ${o.date}, Status: ${o.status}, Total: ₹${o.totalAmount}, Payment/Finance: ${o.financeStatus || "Pending"}, Expected Delivery: ${o.deliveryTime || "Scheduled soon"}.
   Items: [${itemsStr}]
   Fulfillment Stage: ${f.stopStatus || f.deliveryTripStatus || f.pickingStatus || "In processing"}${f.dispatchedAt ? ` (Dispatched on ${f.dispatchedAt})` : ""}`;
					})
					.join("\n")
			: "No orders found in database for this customer.";

	const customerSummary = context.customer
		? `Customer Name: ${context.customer.name} (ID: ${context.customer.id})
Email: ${context.customer.email || "N/A"}, Phone: ${context.customer.phone || "N/A"}
Loyalty Tier: ${context.customer.loyaltyTier || "Bronze"} (${context.customer.loyaltyPoints || 0} pts)
Store Credit Balance: ₹${context.customer.storeCredit || 0}
Credit Limit: ₹${context.customer.creditLimit || 0}, Credit Used: ₹${context.customer.creditUsed || 0}`
		: `User: ${userName || "Customer"} (User ID: ${userUid})
No separate customer profile record linked yet.`;

	const systemPrompt = `You are the official Evaluna Customer Support Assistant on the Customer Portal.
You assist customers with tracking their orders, payment information, delivery updates, and using their dashboard.

=== CRITICAL CUSTOMER-FACING RULES ===
1. NEVER output technical URL slash paths (DO NOT say "/finance", "/sales/orders", "/sales/pos", etc.).
2. DO NOT mention internal staff departments like "Finance Department", "Sales Department", or "Procurement System".
3. To guide customers around their dashboard, ALWAYS use their Customer Portal navigation menu tabs:
   - For bills, payments, and invoices: "Go to the **Payments** tab in your dashboard menu".
   - For order status, item details, and live delivery: "Go to the **Orders** tab in your dashboard menu".
   - For browsing items and placing new orders: "Go to the **Products** tab in your dashboard menu".
   - For updating profile/address: "Go to the **Profile** tab in your dashboard menu".
4. ALWAYS check the customer's specific orders first!
   - Every customer has their own individual orders, amounts, and statuses.
   - When asked about payments, bills, or order status, directly cite their actual Order ID, Date, Amount (in ₹), and Status from the context below.
   - If they have no orders, state clearly: "Aapke account me abhi koi active order darj nahi hai."
5. For payment and account support:
   - Provide direct contact: Call **${OFFICIAL_COMPANY_INFO.phone}** or Email **${OFFICIAL_COMPANY_INFO.email}**.
6. Language: You understand and reply in English, Hindi (हिन्दी), or natural conversational Hinglish depending on what the user speaks.
7. Tone: Helpful, empathetic, accurate, and concise. Use bold text and bullet points.

=== OFFICIAL COMPANY CONTACT ===
Phone: ${OFFICIAL_COMPANY_INFO.phone} (${OFFICIAL_COMPANY_INFO.phoneExtensions})
Email: ${OFFICIAL_COMPANY_INFO.email}
Support Hours: ${OFFICIAL_COMPANY_INFO.operatingHours}

=== AUTHENTIC DATABASE CONTEXT FOR THIS USER ===
${customerSummary}

Recent Orders for this Account:
${ordersContextStr}
`;

	// 3. Assemble chat message history for Groq
	const messages: ChatMessage[] = [
		{ role: "system", content: systemPrompt },
	];

	// Add recent session history (up to last 6 messages)
	const recentHistory = conversationHistory.slice(-6);
	for (const msg of recentHistory) {
		messages.push({
			role: msg.sender === "user" ? "user" : "assistant",
			content: msg.content,
		});
	}

	// Add current query
	messages.push({
		role: "user",
		content,
	});

	// Check if user is asking for human escalation
	const lowerQuery = content.toLowerCase();
	const isEscalationRequest =
		lowerQuery.includes("human") ||
		lowerQuery.includes("manager") ||
		lowerQuery.includes("executive") ||
		lowerQuery.includes("agent") ||
		lowerQuery.includes("talk to someone") ||
		lowerQuery.includes("call me") ||
		lowerQuery.includes("insan se baat") ||
		lowerQuery.includes("complaint");

	try {
		const groqResult = await generateGroqCompletion({
			messages,
			temperature: 0.2,
			maxTokens: 800,
		});

		return {
			text: groqResult.text,
			modelUsed: groqResult.model,
			escalated: isEscalationRequest,
			metadata: {
				orderCount: context.recentOrders.length,
				recentOrderIds: context.recentOrders.map((o) => o.orderId),
			},
		};
	} catch (error: any) {
		console.error("Groq AI Inference error, generating deterministic fallback:", error);

		// Grounded deterministic fallback tailored to this specific customer
		let fallbackText = "";

		if (
			lowerQuery.includes("payment") ||
			lowerQuery.includes("credit") ||
			lowerQuery.includes("invoice") ||
			lowerQuery.includes("bill") ||
			lowerQuery.includes("paisa")
		) {
			if (context.recentOrders.length > 0) {
				const latest = context.recentOrders[0];
				fallbackText = `Aapke account me order aur payment ka taja vivaran yeh hai:
• **Order ID:** #${latest.orderId}
• **Tarikh:** ${latest.date}
• **Total Rashi:** ₹${latest.totalAmount}
• **Payment Status:** ${latest.financeStatus || "Pending"}
• **Order Status:** ${latest.status.toUpperCase()}

Aap apne sabhi bills aur payment receipts dekhne ke liye apne dashboard me **Payments** tab par ja sakte hain.
Kisi bhi sahayata ke liye aap humare support number **${OFFICIAL_COMPANY_INFO.phone}** par call ya **${OFFICIAL_COMPANY_INFO.email}** par email kar sakte hain.`;
			} else if (context.customer) {
				fallbackText = `Aapke account me abhi koi pending bill darj nahi hai.
• **Store Credit:** ₹${context.customer.storeCredit || "0"}
• **Credit Limit:** ₹${context.customer.creditLimit || "0"}
• **Loyalty Points:** ${context.customer.loyaltyPoints || 0} (${context.customer.loyaltyTier || "Bronze"})

Aap apne dashboard me **Payments** tab par jakar purani payment history dekh sakte hain ya support team se **${OFFICIAL_COMPANY_INFO.phone}** par sampark kar sakte hain.`;
			} else {
				fallbackText = `Apne invoices aur payment details dekhne ke liye kripya apne dashboard me **Payments** tab par jayein.
Aap humari billing aur support team se **${OFFICIAL_COMPANY_INFO.phone}** par call ya **${OFFICIAL_COMPANY_INFO.email}** par email dwara sampark kar sakte hain.`;
			}
		} else if (lowerQuery.includes("order") || lowerQuery.includes("track")) {
			if (context.recentOrders.length > 0) {
				const latest = context.recentOrders[0];
				fallbackText = `Aapke order ka live update:
• **Order ID:** #${latest.orderId}
• **Tarikh:** ${latest.date}
• **Status:** ${latest.status.toUpperCase()}
• **Total Amount:** ₹${latest.totalAmount}
• **Delivery Stage:** ${latest.fulfillment.stopStatus || latest.fulfillment.deliveryTripStatus || latest.fulfillment.pickingStatus || "Pratiksharat (Processing)"}
• **Expected Delivery:** ${latest.deliveryTime || "Jald tay hogi"}

Puri detail aur item list dekhne ke liye apne dashboard me **Orders** tab par jayein.`;
			} else {
				fallbackText =
					"Aapke account me abhi koi active order darj nahi hai. Naya order place karne ke liye apne dashboard me **Products** tab par jayein.";
			}
		} else if (
			lowerQuery.includes("contact") ||
			lowerQuery.includes("phone") ||
			lowerQuery.includes("email") ||
			lowerQuery.includes("support")
		) {
			fallbackText = `Aap humari customer support team se sidhe sampark kar sakte hain:
• **Phone:** ${OFFICIAL_COMPANY_INFO.phone} (${OFFICIAL_COMPANY_INFO.phoneExtensions})
• **Email:** ${OFFICIAL_COMPANY_INFO.email}
• **Samay:** ${OFFICIAL_COMPANY_INFO.operatingHours}

Hum aapki sahayata ke liye sadaiv tatpar hain!`;
		} else {
			fallbackText = `Namaste! Main aapka Evaluna Customer Support Assistant hoon.
Main aapke account ke anusaar sahayata kar sakta hoon:
• **Order Status:** "Mera order kahan hai?"
• **Payment & Bills:** "Payment status check karein" (Aapke dashboard ke **Payments** tab me bhi upalabdha hai)
• **Naya Order:** Dashboard ke **Products** tab me jayein
• **Direct Support:** Hume call karein **${OFFICIAL_COMPANY_INFO.phone}** par

Bataiye, main aapki kya madad kar sakta hoon?`;
		}

		return {
			text: fallbackText,
			modelUsed: "evaluna-customer-grounded-fallback",
			escalated: isEscalationRequest,
			metadata: {
				fallback: true,
				recentOrderIds: context.recentOrders.map((o) => o.orderId),
			},
		};
	}
}
