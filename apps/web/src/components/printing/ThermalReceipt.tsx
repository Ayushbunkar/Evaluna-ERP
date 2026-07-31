import type React from "react";

export interface ThermalReceiptProps {
	order: any;
	branch: any;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
	order,
	branch,
}) => {
	return (
		<div className="mx-auto w-80 max-w-[80mm] bg-white p-4 font-mono text-black text-sm leading-tight shadow-sm">
			<div className="mb-4 text-center">
				<h2 className="font-bold text-xl">{branch?.name || "Branch Name"}</h2>
				<p className="whitespace-pre-line">
					{branch?.address || "Branch Address"}
				</p>
				<p>{branch?.phone || "Phone"}</p>
			</div>

			<div className="mb-2 border-black border-b border-dashed pb-2">
				<p>Order #: {order?.id || "N/A"}</p>
				<p>
					Date:{" "}
					{order?.createdAt
						? new Date(order.createdAt).toLocaleString()
						: "N/A"}
				</p>
			</div>

			<table className="mb-2 w-full">
				<thead>
					<tr className="border-black border-b border-dashed">
						<th className="py-1 text-left font-normal">Item</th>
						<th className="py-1 text-right font-normal">Qty</th>
						<th className="py-1 text-right font-normal">Price</th>
					</tr>
				</thead>
				<tbody>
					{(order?.items || []).map((item: any, idx: number) => (
						<tr key={idx}>
							<td className="py-1">{item.name || "Item Name"}</td>
							<td className="py-1 text-right">{item.quantity || 1}</td>
							<td className="py-1 text-right">
								{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
							</td>
						</tr>
					))}
					{(!order?.items || order.items.length === 0) && (
						<tr>
							<td colSpan={3} className="py-2 text-center text-gray-500 italic">
								No items
							</td>
						</tr>
					)}
				</tbody>
			</table>

			<div className="space-y-1 border-black border-t border-dashed pt-2">
				<div className="flex justify-between">
					<span>Subtotal</span>
					<span>{order?.subtotal?.toFixed(2) || "0.00"}</span>
				</div>
				<div className="flex justify-between">
					<span>Tax</span>
					<span>{order?.tax?.toFixed(2) || "0.00"}</span>
				</div>
				<div className="mt-2 flex justify-between border-black border-t pt-2 font-bold text-base">
					<span>Total</span>
					<span>{order?.total?.toFixed(2) || "0.00"}</span>
				</div>
			</div>

			<div className="mt-6 text-center">
				<p>*** Thank you! ***</p>
				<p>Please come again</p>
			</div>
		</div>
	);
};
