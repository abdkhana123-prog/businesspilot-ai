export function openWhatsApp(
  phone: string | null | undefined,
  message: string,
) {
  if (!phone || !phone.trim()) {
    alert("Phone number is required.");
    return;
  }

  let cleaned = phone.replace(/[^0-9]/g, "");

  // 03xxxxxxxxx -> 923xxxxxxxxx (Pakistan local format auto-fix)
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = "92" + cleaned.slice(1);
  }

  if (cleaned.length < 10) {
    alert(
      "Phone number incomplete hai. Full number country code ke sath likhein (e.g. 923001234567 ya 971501234567).",
    );
    return;
  }

  const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

export function buildLeadWhatsAppMessage(lead: {
  name: string;
  interest?: string | null;
  deal_value?: number | null;
}) {
  return `Hi ${lead.name},\n\nI hope you are doing well. I am following up regarding your interest in ${
    lead.interest || "our services"
  }.\n\nLet me know when you are available for a quick chat to discuss the next steps.\n\nBest regards,\nBusinessPilot Team`;
}

export function buildInvoiceWhatsAppMessage(invoice: {
  customer_name: string;
  invoice_number: string;
  description?: string;
  total: number;
  payment_status: string;
}) {
  const isPaid =
    String(invoice.payment_status).toLowerCase() === "paid";

  if (isPaid) {
    return `Hi ${invoice.customer_name},\n\nThank you for your payment on invoice ${
      invoice.invoice_number
    } ($${invoice.total.toFixed(
      2,
    )}).\n\nWe appreciate your business!\n\nBest regards,\nBusinessPilot Team`;
  }

  return `Hi ${invoice.customer_name},\n\nFriendly reminder: invoice ${
    invoice.invoice_number
  } for "${
    invoice.description || "services"
  }" totaling $${invoice.total.toFixed(
    2,
  )} is still pending.\n\nPlease let us know if payment is already done, or if you need the invoice resent.\n\nThank you,\nBusinessPilot Team`;
}

