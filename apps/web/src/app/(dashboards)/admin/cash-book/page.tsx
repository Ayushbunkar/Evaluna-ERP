"use client";

import { CashBookView } from "@/components/cashbook/cash-book-view";

export default function AdminCashBookPage() {
	return (
		<CashBookView
			title="Admin Cash Book"
			subtitle="Organization-wide cash ledger, registers, and transactions audit."
		/>
	);
}
