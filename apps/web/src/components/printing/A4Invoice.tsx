import type React from "react";

export interface A4InvoiceProps {
	order: any;
	branch: any;
	customer?: any;
}

export const A4Invoice: React.FC<A4InvoiceProps> = ({
	order,
	branch,
	customer,
}) => {
	return (
		<div className="mx-auto min-h-[297mm] w-[210mm] bg-white p-[20mm] text-black text-sm shadow-md">
			<div className="mb-6 flex items-start justify-between border-gray-800 border-b-2 pb-6">
				<div>
					<h1 className="mb-2 font-bold text-4xl text-gray-900">INVOICE</h1>
					<p className="text-gray-600">Invoice #: {order?.id || "N/A"}</p>
					<p className="text-gray-600">
						Date:{" "}
						{order?.createdAt
							? new Date(order.createdAt).toLocaleDateString()
							: "N/A"}
					</p>
				</div>
				<div className="text-right">
					<h2 className="font-bold text-2xl text-gray-900">
						{branch?.name || "Company Name"}
					</h2>
					<p className="mt-1 whitespace-pre-line text-gray-600">
						{branch?.address || "Company Address\nCity, State ZIP"}
					</p>
					<p className="text-gray-600">{branch?.phone || "Phone Number"}</p>
					<p className="text-gray-600">
						{branch?.email || "email@example.com"}
					</p>
				</div>
			</div>

			<div className="mb-8 flex justify-between">
				<div className="w-1/2 pr-4">
					<h3 className="mb-2 border-gray-300 border-b pb-1 font-bold text-gray-800">
						Bill To:
					</h3>
					<p className="font-medium text-gray-900">
						{customer?.name || "Customer Name"}
					</p>
					<p className="whitespace-pre-line text-gray-600">
						{customer?.billingAddress || "Billing Address\nCity, State ZIP"}
					</p>
					<p className="text-gray-600">{customer?.phone || ""}</p>
				</div>
				<div className="w-1/2 pl-4">
					<h3 className="mb-2 border-gray-300 border-b pb-1 font-bold text-gray-800">
						Ship To:
					</h3>
					<p className="font-medium text-gray-900">
						{customer?.shippingName || customer?.name || "Customer Name"}
					</p>
					<p className="whitespace-pre-line text-gray-600">
						{customer?.shippingAddress ||
							customer?.billingAddress ||
							"Shipping Address\nCity, State ZIP"}
					</p>
				</div>
			</div>

			<table className="mb-8 w-full border-collapse">
				<thead>
					<tr className="bg-gray-100 text-gray-800">
						<th className="border border-gray-300 px-4 py-2 text-left">
							Item Description
						</th>
						<th className="w-24 border border-gray-300 px-4 py-2 text-center">
							HSN
						</th>
						<th className="w-24 border border-gray-300 px-4 py-2 text-right">
							Tax %
						</th>
						<th className="w-24 border border-gray-300 px-4 py-2 text-right">
							Rate
						</th>
						<th className="w-20 border border-gray-300 px-4 py-2 text-right">
							Qty
						</th>
						<th className="w-32 border border-gray-300 px-4 py-2 text-right">
							Total
						</th>
					</tr>
				</thead>
				<tbody>
					{(order?.items || []).map((item: any, idx: number) => (
						<tr key={idx} className="border-gray-200 border-b">
							<td className="border border-gray-300 px-4 py-2">
								{item.name || "Item Name"}
							</td>
							<td className="border border-gray-300 px-4 py-2 text-center">
								{item.hsn || "-"}
							</td>
							<td className="border border-gray-300 px-4 py-2 text-right">
								{item.taxPercent || "0"}%
							</td>
							<td className="border border-gray-300 px-4 py-2 text-right">
								{item.price ? Number(item.price).toFixed(2) : "0.00"}
							</td>
							<td className="border border-gray-300 px-4 py-2 text-right">
								{item.quantity || 1}
							</td>
							<td className="border border-gray-300 px-4 py-2 text-right">
								{((Number(item.price) || 0) * (item.quantity || 1)).toFixed(2)}
							</td>
						</tr>
					))}
					{(!order?.items || order.items.length === 0) && (
						<tr>
							<td
								colSpan={6}
								className="border border-gray-300 px-4 py-8 text-center text-gray-500 italic"
							>
								No items found
							</td>
						</tr>
					)}
				</tbody>
			</table>

			<div className="flex justify-end">
				<div className="w-64 space-y-2">
					<div className="flex justify-between text-gray-600">
						<span>Subtotal:</span>
						<span>
							{order?.subtotal ? Number(order.subtotal).toFixed(2) : "0.00"}
						</span>
					</div>
					<div className="flex justify-between border-gray-300 border-b pb-2 text-gray-600">
						<span>Tax Total:</span>
						<span>{order?.tax ? Number(order.tax).toFixed(2) : "0.00"}</span>
					</div>
					<div className="flex justify-between pt-2 font-bold text-gray-900 text-lg">
						<span>Grand Total:</span>
						<span>
							{order?.total ? Number(order.total).toFixed(2) : "0.00"}
						</span>
					</div>
				</div>
			</div>

			<div className="mt-16 border-gray-300 border-t pt-8 text-center text-gray-500 text-xs">
				<p>Thank you for your business!</p>
				<p>
					If you have any questions about this invoice, please contact{" "}
					{branch?.email || "support"} or call {branch?.phone || "us"}.
				</p>
			</div>
		</div>
	);
};

