/**
 * Customer Support AI Agent Orchestrator
 * Integrates Groq LLM inference with authoritative ERP database context.
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
	// 1. Fetch real context from DB
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
						return `- Order #${o.orderId}: Date: ${o.date}, Status: ${o.status}, Total: ₹${o.totalAmount}, Finance: ${o.financeStatus}, Delivery Estimated: ${o.deliveryTime || "Pending schedule"}.
   Items: [${itemsStr}]
   Fulfillment: Picking: ${f.pickingStatus || "Not started"}, Packages: ${f.packages.length > 0 ? f.packages.map((p) => `${p.packageNumber} (${p.status})`).join(", ") : "None"}, Trip: ${f.deliveryTripStatus || "Not dispatched"}${f.dispatchedAt ? ` (Dispatched: ${f.dispatchedAt})` : ""}`;
					})
					.join("\n")
			: "No orders found in database for this customer.";

	const customerSummary = context.customer
		? `Customer Name: ${context.customer.name} (ID: ${context.customer.id})
Email: ${context.customer.email || "N/A"}, Phone: ${context.customer.phone || "N/A"}
Loyalty Tier: ${context.customer.loyaltyTier || "Bronze"} (${context.customer.loyaltyPoints || 0} pts)
Credit Balance: Limit ₹${context.customer.creditLimit || 0}, Used ₹${context.customer.creditUsed || 0}, Store Credit ₹${context.customer.storeCredit || 0}`
		: `User Name: ${userName || "Valued User"} (Role: ${userRole || "User"})
No linked customer account profile yet.`;

	const systemPrompt = `You are the official Evaluna ERP AI Customer Support Assistant.
You assist customers and users with tracking orders, delivery updates, payments, dashboard navigation, and company policies.

=== STRICT FACTUAL GROUNDING RULES ===
1. You MUST ONLY use the real database data provided in the CURRENT CONTEXT below.
2. NEVER invent, fabricate, or hallucinate order numbers, dates, prices, delivery agents, or tracking numbers.
3. If the user asks about an order number not listed in their context, tell them honestly: "I could not find Order #... under your account. Your recent orders are: ...".
4. If the user asks for company contact information, provide ONLY the official contact info listed below.
5. Language: You understand and reply in English, Hindi (हिन्दी), or natural conversational Hinglish depending on what the user speaks.
6. Tone: Courteous, professional, empathetic, and clear. Use bullet points and bold highlights for readability.
7. Escalation: If the customer is deeply dissatisfied, requests a human manager, or reports damaged goods, inform them:
   - Our customer helpline: ${OFFICIAL_COMPANY_INFO.phone} (${OFFICIAL_COMPANY_INFO.phoneExtensions})
   - Email: ${OFFICIAL_COMPANY_INFO.email}
   - Offer to log a support escalation ticket.

=== OFFICIAL COMPANY CONTACT ===
Company: ${OFFICIAL_COMPANY_INFO.companyName}
Phone: ${OFFICIAL_COMPANY_INFO.phone} (${OFFICIAL_COMPANY_INFO.phoneExtensions})
Email: ${OFFICIAL_COMPANY_INFO.email}
Support Hours: ${OFFICIAL_COMPANY_INFO.operatingHours}
Address: ${OFFICIAL_COMPANY_INFO.headquarters}

=== POLICIES ===
Cancellation: ${OFFICIAL_COMPANY_INFO.policies.cancellation}
Returns: ${OFFICIAL_COMPANY_INFO.policies.returns}
Credit Payments: ${OFFICIAL_COMPANY_INFO.policies.creditPayment}

=== DASHBOARD NAVIGATION LINKS ===
- View / Manage Orders: /sales/orders
- Place New Order / POS: /sales/pos
- Invoices & Billing: /finance
- Warehouse Receiving (GRN): /procurement/incoming
- Live Driver Route: /driver
- Contact Helpdesk: /contact

=== AUTHENTIC DATABASE CONTEXT ===
${customerSummary}

Recent Orders in System:
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

		// Deterministic factual fallback if Groq network/limit is hit
		let fallbackText = "";

		if (lowerQuery.includes("order") || lowerQuery.includes("track")) {
			if (context.recentOrders.length > 0) {
				const latest = context.recentOrders[0];
				fallbackText = `Here is your most recent order details from our database:
• **Order ID:** #${latest.orderId}
• **Date:** ${latest.date}
• **Status:** ${latest.status.toUpperCase()}
• **Total Amount:** ₹${latest.totalAmount}
• **Fulfillment Stage:** ${latest.fulfillment.stopStatus || latest.fulfillment.deliveryTripStatus || latest.fulfillment.pickingStatus || "In processing"}
• **Expected Delivery:** ${latest.deliveryTime || "Scheduled soon"}

You can view full details in your dashboard at **/sales/orders**.`;
			} else {
				fallbackText =
					"You currently do not have any active orders in the system. You can place a new order at **/sales/pos** or browse products.";
			}
		} else if (
			lowerQuery.includes("contact") ||
			lowerQuery.includes("phone") ||
			lowerQuery.includes("email") ||
			lowerQuery.includes("support")
		) {
			fallbackText = `You can reach our official customer support team directly:
• **Phone:** ${OFFICIAL_COMPANY_INFO.phone} (${OFFICIAL_COMPANY_INFO.phoneExtensions})
• **Email:** ${OFFICIAL_COMPANY_INFO.email}
• **Hours:** ${OFFICIAL_COMPANY_INFO.operatingHours}
• **Office:** ${OFFICIAL_COMPANY_INFO.headquarters}`;
		} else if (lowerQuery.includes("payment") || lowerQuery.includes("credit")) {
			fallbackText = context.customer
				? `Here is your current credit and payment balance:
• **Credit Limit:** ₹${context.customer.creditLimit || "0"}
• **Credit Used:** ₹${context.customer.creditUsed || "0"}
• **Store Credit:** ₹${context.customer.storeCredit || "0"}
• **Loyalty Tier:** ${context.customer.loyaltyTier || "Bronze"} (${context.customer.loyaltyPoints || 0} Points)

To view all invoices and payment receipts, please visit the **/finance** section.`
				: `To check your invoices and payments, please visit the **/finance** section or contact our billing team at ${OFFICIAL_COMPANY_INFO.email}.`;
		} else {
			fallbackText = `Hello! I am your Evaluna Support Assistant. I can help you:
• **Track your orders:** Ask "Where is my order?"
• **Delivery updates:** Ask "When will my order arrive?"
• **Payment & Credit info:** Ask "Check my payment status"
• **Help with navigation:** Ask "How do I place an order?"
• **Direct Support:** Call us at **${OFFICIAL_COMPANY_INFO.phone}**

How can I help you right now?`;
		}

		return {
			text: fallbackText,
			modelUsed: "evaluna-grounded-fallback",
			escalated: isEscalationRequest,
			metadata: {
				fallback: true,
				recentOrderIds: context.recentOrders.map((o) => o.orderId),
			},
		};
	}
}
