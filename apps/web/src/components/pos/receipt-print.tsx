import React from "react";
import { format } from "date-fns";

export const ReceiptPrint = React.forwardRef<HTMLDivElement, any>(({ order, storeInfo }, ref) => {
  return (
    <div ref={ref} className="hidden print:block font-mono text-sm w-[80mm] p-4 bg-white text-black mx-auto">
      <div className="text-center mb-4 border-b pb-4 border-dashed border-gray-400">
        <h1 className="text-2xl font-bold uppercase">{storeInfo?.name || "Store Name"}</h1>
        <p>{storeInfo?.address || "Store Address"}</p>
        <p>GSTIN: {storeInfo?.gst || "N/A"}</p>
        <p>Phone: {storeInfo?.phone || "N/A"}</p>
      </div>

      <div className="mb-4">
        <p>Receipt #: {order.id}</p>
        <p>Date: {format(new Date(order.created_at || new Date()), "dd/MM/yyyy HH:mm")}</p>
        <p>Cashier: {order.user_uid}</p>
      </div>

      <table className="w-full mb-4 border-t border-b border-dashed border-gray-400">
        <thead>
          <tr className="text-left border-b border-dashed border-gray-400">
            <th className="py-1">Item</th>
            <th className="text-center">Qty</th>
            <th className="text-right">Price</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item: any, idx: number) => (
            <tr key={idx}>
              <td className="py-1 pr-1 break-words">{item.name}</td>
              <td className="text-center align-top">{item.qty}</td>
              <td className="text-right align-top">{item.price}</td>
              <td className="text-right align-top">{(item.qty * parseFloat(item.price)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between font-bold text-lg mb-4">
        <span>TOTAL</span>
        <span>₹{parseFloat(order.total_amount).toFixed(2)}</span>
      </div>

      <div className="text-center mt-6 pt-4 border-t border-dashed border-gray-400">
        <p className="font-bold">Thank you for your business!</p>
        <p className="text-xs mt-1">Please visit again</p>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
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
      `}} />
    </div>
  );
});

ReceiptPrint.displayName = "ReceiptPrint";
