import React from 'react';

export interface ThermalReceiptProps {
  order: any;
  branch: any;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ order, branch }) => {
  return (
    <div className="w-80 max-w-[80mm] p-4 bg-white text-black font-mono text-sm leading-tight mx-auto shadow-sm">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">{branch?.name || 'Branch Name'}</h2>
        <p className="whitespace-pre-line">{branch?.address || 'Branch Address'}</p>
        <p>{branch?.phone || 'Phone'}</p>
      </div>

      <div className="border-b border-black border-dashed mb-2 pb-2">
        <p>Order #: {order?.id || 'N/A'}</p>
        <p>Date: {order?.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</p>
      </div>

      <table className="w-full mb-2">
        <thead>
          <tr className="border-b border-black border-dashed">
            <th className="text-left font-normal py-1">Item</th>
            <th className="text-right font-normal py-1">Qty</th>
            <th className="text-right font-normal py-1">Price</th>
          </tr>
        </thead>
        <tbody>
          {(order?.items || []).map((item: any, idx: number) => (
            <tr key={idx}>
              <td className="py-1">{item.name || 'Item Name'}</td>
              <td className="text-right py-1">{item.quantity || 1}</td>
              <td className="text-right py-1">{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
            </tr>
          ))}
          {(!order?.items || order.items.length === 0) && (
            <tr>
              <td colSpan={3} className="text-center py-2 italic text-gray-500">No items</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="border-t border-black border-dashed pt-2 space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{order?.subtotal?.toFixed(2) || '0.00'}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>{order?.tax?.toFixed(2) || '0.00'}</span>
        </div>
        <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-black">
          <span>Total</span>
          <span>{order?.total?.toFixed(2) || '0.00'}</span>
        </div>
      </div>

      <div className="text-center mt-6">
        <p>*** Thank you! ***</p>
        <p>Please come again</p>
      </div>
    </div>
  );
};
