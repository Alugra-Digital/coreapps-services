function itemsToLineItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item, i) => {
    const qty = item.qty ?? item.quantity ?? 1;
    const price = item.price ?? item.unitPrice ?? 0;
    const subtotal = item.subtotal ?? qty * price;
    return {
      number: i + 1,
      description: item.description ?? item.itemDescription ?? '',
      quantity: qty,
      unit: item.unit ?? 'Unit',
      unitPrice: Number(price),
      subtotal: Number(subtotal),
    };
  });
}

function lineItemsToItems(lineItems) {
  if (!Array.isArray(lineItems)) return [];
  return lineItems.map((li) => ({
    description: li.description ?? li.itemDescription ?? '',
    qty: li.quantity ?? li.qty ?? 1,
    price: li.unitPrice ?? li.price ?? 0,
  }));
}

export function toDocSchema(quotation, client = null) {
  if (!quotation) return null;
  const items = Array.isArray(quotation.items) ? quotation.items : [];
  const lineItems = itemsToLineItems(items);
  const subtotal = parseFloat(quotation.subtotal) || 0;
  const taxAmount = parseFloat(quotation.ppn) || 0;
  const grandTotal = parseFloat(quotation.grandTotal) || 0;

  return {
    id: String(quotation.id),
    quotationNumber: quotation.number ?? '',
    quotationDate: quotation.date ? new Date(quotation.date).toISOString().slice(0, 10) : null,
    validUntil: quotation.validUntil ?? null,
    clientId: quotation.clientId != null ? String(quotation.clientId) : null,
    clientName: client?.name ?? quotation.clientName ?? '',
    projectId: quotation.projectId ?? null,
    projectName: quotation.projectName ?? null,
    serviceOffered: quotation.serviceOffered ?? '',
    quotationMonth: quotation.quotationMonth ?? null,
    lineItems,
    subtotal,
    taxAmount,
    taxTypeId: quotation.taxTypeId ?? null,
    grandTotal,
    paymentTerms: quotation.paymentTerms ?? null,
    validityPeriod: quotation.validityPeriod ?? null,
    termsConditions: quotation.termsConditions ?? null,
    scopeOfWork: quotation.scopeOfWork ?? null,
    status: quotation.status ?? 'draft',
    createdAt: quotation.createdAt?.toISOString?.() ?? null,
    updatedAt: quotation.updatedAt?.toISOString?.() ?? null,
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
    serviceOffered: body.serviceOffered,
    quotationMonth: body.quotationMonth,
    paymentTerms: body.paymentTerms,
    validityPeriod: body.validityPeriod,
    termsConditions: body.termsConditions,
    scopeOfWork: body.scopeOfWork,
    status: body.status ?? 'draft',
  };

  if (body.quotationNumber) m.number = body.quotationNumber;
  if (body.quotationDate) m.date = new Date(body.quotationDate);
  if (body.validUntil) m.validUntil = body.validUntil;
  if (body.clientId != null) m.clientId = Number(body.clientId);
  if (body.projectId != null) m.projectId = body.projectId;

  return m;
}
