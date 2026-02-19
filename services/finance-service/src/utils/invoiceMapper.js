const DEFAULT_COMPANY = {
  letterhead: 'PT Alugra Indonesia',
  companyName: 'PT Alugra Indonesia',
  logoUrl: '',
  address: 'Jl. Sudirman No. 123, Jakarta Pusat 10220',
  phone: '+62 21 1234567',
};

const DEFAULT_PAYMENT = {
  bank: 'Bank BCA',
  accountNumber: '1234567890',
  branch: 'Cabang Sudirman',
  accountName: 'PT Alugra Indonesia',
  npwp: '',
};

const DEFAULT_APPROVAL = {
  position: 'Direktur',
  name: '',
  signatureUrl: '',
};

function itemsToLineItems(items, taxRate = 11) {
  if (!Array.isArray(items)) return [];
  return items.map((item, i) => {
    const qty = item.qty ?? item.quantity ?? 1;
    const price = item.price ?? item.unitPrice ?? 0;
    const subtotal = item.subtotal ?? qty * price;
    const taxAmount = item.taxAmount ?? subtotal * (taxRate / 100);
    const priceAfterTax = item.priceAfterTax ?? subtotal + taxAmount;
    return {
      number: i + 1,
      itemDescription: item.description ?? item.itemDescription ?? '',
      quantity: qty,
      unit: item.unit ?? 'Unit',
      price: Number(price),
      subtotal: Number(subtotal),
      taxRate: item.taxRate ?? taxRate,
      taxAmount: Number(taxAmount),
      priceAfterTax: Number(priceAfterTax),
    };
  });
}

function lineItemsToItems(lineItems) {
  if (!Array.isArray(lineItems)) return [];
  return lineItems.map((li) => ({
    description: li.itemDescription ?? li.description ?? '',
    qty: li.quantity ?? li.qty ?? 1,
    price: li.price ?? li.unitPrice ?? 0,
  }));
}

export function toDocSchema(invoice, client = null) {
  if (!invoice) return null;
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const lineItems = itemsToLineItems(items, 11);
  const companyInfo = invoice.companyInfo ?? DEFAULT_COMPANY;
  const billingInfo = invoice.billingInfo ?? {
    companyName: client?.name ?? client?.companyName ?? '',
    address: client?.address ?? '',
    phone: client?.phone ?? '',
    pic: client?.pic ?? null,
  };
  const invoiceInfo = invoice.invoiceInfo ?? {
    invoiceName: 'Invoice Penjualan',
    invoiceNumber: invoice.number ?? '',
    invoiceDate: invoice.date ? new Date(invoice.date).toISOString().slice(0, 10) : null,
    taxInvoice: invoice.taxInvoice ?? '',
    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().slice(0, 10) : null,
  };
  const paymentInfo = invoice.paymentInfo ?? DEFAULT_PAYMENT;
  const approval = invoice.approval ?? DEFAULT_APPROVAL;

  return {
    id: `INV-${invoice.id}`,
    companyInfo,
    invoiceInfo,
    billingInfo,
    lineItems,
    paymentInfo,
    approval,
    notes: invoice.notes ?? null,
    status: invoice.status ?? 'DRAFT',
    createdAt: invoice.createdAt?.toISOString?.() ?? null,
    updatedAt: invoice.updatedAt?.toISOString?.() ?? null,
  };
}

export function fromDocSchema(body) {
  if (!body) return {};
  const lineItems = body.lineItems ?? [];
  const items = lineItemsToItems(lineItems);
  const subtotal = items.reduce((sum, i) => sum + (i.qty * i.price), 0);
  const ppn = subtotal * 0.11;
  const grandTotal = subtotal + ppn;

  const m = {
    items,
    subtotal: String(subtotal),
    ppn: String(ppn),
    grandTotal: String(grandTotal),
    pph: body.pph != null ? String(body.pph) : '0',
    status: body.status ?? 'DRAFT',
    companyInfo: body.companyInfo,
    invoiceInfo: body.invoiceInfo,
    billingInfo: body.billingInfo,
    paymentInfo: body.paymentInfo,
    approval: body.approval,
    notes: body.notes,
  };

  if (body.invoiceInfo) {
    if (body.invoiceInfo.invoiceDate) m.date = new Date(body.invoiceInfo.invoiceDate);
    if (body.invoiceInfo.dueDate) m.dueDate = new Date(body.invoiceInfo.dueDate);
  }
  if (body.clientId != null) m.clientId = Number(body.clientId);
  return m;
}
