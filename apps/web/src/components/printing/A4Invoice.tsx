import React from 'react';

export interface A4InvoiceProps {
  order: any;
  branch: any;
  customer?: any;
}

export const A4Invoice: React.FC<A4InvoiceProps> = ({ order, branch, customer }) => {
  return (
    <div className="w-[210mm] min-h-[297mm] p-[20mm] bg-white text-black text-sm mx-auto shadow-md">
      <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">INVOICE</h1>
          <p className="text-gray-600">Invoice #: {order?.id || 'N/A'}</p>
          <p className="text-gray-600">Date: {order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-900">{branch?.name || 'Company Name'}</h2>
          <p className="text-gray-600 mt-1 whitespace-pre-line">{branch?.address || 'Company Address\nCity, State ZIP'}</p>
          <p className="text-gray-600">{branch?.phone || 'Phone Number'}</p>
          <p className="text-gray-600">{branch?.email || 'email@example.com'}</p>
        </div>
      </div>

      <div className="flex justify-between mb-8">
        <div className="w-1/2 pr-4">
          <h3 className="font-bold text-gray-800 border-b border-gray-300 mb-2 pb-1">Bill To:</h3>
          <p className="font-medium text-gray-900">{customer?.name || 'Customer Name'}</p>
          <p className="text-gray-600 whitespace-pre-line">{customer?.billingAddress || 'Billing Address\nCity, State ZIP'}</p>
          <p className="text-gray-600">{customer?.phone || ''}</p>
        </div>
        <div className="w-1/2 pl-4">
          <h3 className="font-bold text-gray-800 border-b border-gray-300 mb-2 pb-1">Ship To:</h3>
          <p className="font-medium text-gray-900">{customer?.shippingName || customer?.name || 'Customer Name'}</p>
          <p className="text-gray-600 whitespace-pre-line">{customer?.shippingAddress || customer?.billingAddress || 'Shipping Address\nCity, State ZIP'}</p>
        </div>
      </div>

      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-800">
            <th className="border border-gray-300 px-4 py-2 text-left">Item Description</th>
            <th className="border border-gray-300 px-4 py-2 text-center w-24">HSN</th>
            <th className="border border-gray-300 px-4 py-2 text-right w-24">Tax %</th>
            <th className="border border-gray-300 px-4 py-2 text-right w-24">Rate</th>
            <th className="border border-gray-300 px-4 py-2 text-right w-20">Qty</th>
            <th className="border border-gray-300 px-4 py-2 text-right w-32">Total</th>
          </tr>
        </thead>
        <tbody>
          {(order?.items || []).map((item: any, idx: number) => (
            <tr key={idx} className="border-b border-gray-200">
              <td className="border border-gray-300 px-4 py-2">{item.name || 'Item Name'}</td>
              <td className="border border-gray-300 px-4 py-2 text-center">{item.hsn || '-'}</td>
              <td className="border border-gray-300 px-4 py-2 text-right">{item.taxPercent || '0'}%</td>
              <td className="border border-gray-300 px-4 py-2 text-right">{item.price?.toFixed(2) || '0.00'}</td>
              <td className="border border-gray-300 px-4 py-2 text-right">{item.quantity || 1}</td>
              <td className="border border-gray-300 px-4 py-2 text-right">{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
            </tr>
          ))}
          {(!order?.items || order.items.length === 0) && (
            <tr>
              <td colSpan={6} className="border border-gray-300 px-4 py-8 text-center text-gray-500 italic">No items found</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal:</span>
            <span>{order?.subtotal?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex justify-between text-gray-600 border-b border-gray-300 pb-2">
            <span>Tax Total:</span>
            <span>{order?.tax?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex justify-between font-bold text-lg text-gray-900 pt-2">
            <span>Grand Total:</span>
            <span>{order?.total?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-gray-300 text-gray-500 text-xs text-center">
        <p>Thank you for your business!</p>
        <p>If you have any questions about this invoice, please contact {branch?.email || 'support'} or call {branch?.phone || 'us'}.</p>
      </div>
    </div>
  );
};
