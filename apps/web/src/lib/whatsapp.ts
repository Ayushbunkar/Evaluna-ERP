export function generateOrderWhatsAppLink(
  order: any,
  branch: any,
  customerPhone: string
) {
  // Simple WhatsApp order summary logic
  let text = `*Order Receipt*\n`;
  if (branch?.name) {
    text += `Branch: ${branch.name}\n`;
  }
  if (order?.id) {
    text += `Order ID: ${order.id}\n`;
  }
  if (order?.totalAmount !== undefined) {
    text += `Total: $${Number(order.totalAmount).toFixed(2)}\n`;
  }
  
  if (order?.items && Array.isArray(order.items)) {
    text += `\n*Items:*\n`;
    order.items.forEach((item: any) => {
      text += `- ${item.quantity}x ${item.name || 'Item'} ($${Number(item.price || 0).toFixed(2)})\n`;
    });
  }
  
  text += `\nThank you for your purchase!`;
  
  const encodedText = encodeURIComponent(text);
  
  // Format phone number, stripping non-numeric chars
  const cleanPhone = customerPhone.replace(/\D/g, '');
  
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
