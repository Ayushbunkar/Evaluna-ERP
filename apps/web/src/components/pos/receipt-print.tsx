import { format } from "date-fns";
import React from "react";

export const ReceiptPrint = React.forwardRef<HTMLDivElement, any>(
	({ order, storeInfo }, ref) => {
		return (
			<div
				ref={ref}
				className="mx-auto hidden w-[80mm] bg-white p-4 font-mono text-black text-sm print:block"
			>
				<div className="mb-4 border-gray-400 border-b border-dashed pb-4 text-center">
					<h1 className="font-bold text-2xl uppercase">
						{storeInfo?.name || "Store Name"}
					</h1>
					<p>{storeInfo?.address || "Store Address"}</p>
					<p>GSTIN: {storeInfo?.gst || "N/A"}</p>
					<p>Phone: {storeInfo?.phone || "N/A"}</p>
				</div>

				<div className="mb-4">
					<p>Receipt #: {order.id}</p>
					<p>
						Date:{" "}
						{format(
							new Date(order.created_at || new Date()),
							"dd/MM/yyyy HH:mm",
						)}
					</p>
					<p>Cashier: {order.user_uid}</p>
				</div>

				<table
					className="mb-4 w-full border-gray-400 border-t border-b border-dashed"
					style={{ tableLayout: "fixed" }}
				>
					<colgroup>
						<col style={{ width: "55%" }} />
						<col style={{ width: "10%" }} />
						<col style={{ width: "15%" }} />
						<col style={{ width: "20%" }} />
					</colgroup>
					<thead>
						<tr className="border-gray-400 border-b border-dashed text-left">
							<th className="py-1">Item</th>
							<th className="text-center">Qty</th>
							<th className="text-right">Price</th>
							<th className="text-right">Total</th>
						</tr>
					</thead>
					<tbody>
						{order.items?.map((item: any, idx: number) => (
							<tr key={idx}>
								<td
									className="break-words py-1 pr-2"
									style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
								>
									{item.name}
								</td>
								<td className="py-1 text-center align-top">{item.qty}</td>
								<td className="py-1 text-right align-top">
									{Number.parseFloat(item.price).toFixed(2)}
								</td>
								<td className="py-1 text-right align-top">
									{(item.qty * Number.parseFloat(item.price)).toFixed(2)}
								</td>
							</tr>
						))}
					</tbody>
				</table>

				<div className="mb-4 flex justify-between font-bold text-lg">
					<span>TOTAL</span>
					<span>₹{Number.parseFloat(order.total_amount).toFixed(2)}</span>
				</div>

				<div className="mt-6 border-gray-400 border-t border-dashed pt-4 text-center">
					<p className="font-bold">Thank you for your business!</p>
					<p className="mt-1 text-xs">Please visit again</p>
				</div>

				<style
					dangerouslySetInnerHTML={{
						__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 0;
            size: 80mm auto;
          }
        }
      `,
					}}
				/>
			</div>
		);
	},
);

ReceiptPrint.displayName = "ReceiptPrint";

