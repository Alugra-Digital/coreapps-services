const DEFAULT_COMPANY = {
  letterhead: 'PT Alugra Indonesia',
  companyName: 'PT Alugra Indonesia',
  logoUrl: '',
  address: 'Jl. Sudirman No. 123, Jakarta Pusat 10220',
  phone: '+62 21 1234567',
};

const DEFAULT_APPROVAL = {
  position: 'Direktur',
  name: '',
  signatureUrl: '',
};

function itemsToLineItems(items, taxRate = 11) {
  if (!Array.isArray(items)) return [];
  return items.map((item, i) => {
    const qty = item.quantity ?? item.qty ?? 1;
    const price = item.unitPrice ?? item.price ?? 0;
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
  return lineItems.map((li) => {
    const qty = li.quantity ?? li.qty ?? 1;
    const price = li.price ?? li.unitPrice ?? 0;
    return {
      description: li.itemDescription ?? li.description ?? '',
      quantity: qty,
      unitPrice: price,
      unit: li.unit ?? 'Unit',
      taxRate: li.taxRate ?? 11,
      total: li.priceAfterTax ?? li.subtotal ?? qty * price,
    };
  });
}

export function toDocSchema(po) {
  if (!po) return null;
  const items = Array.isArray(po.items) ? po.items : [];
  const lineItems = itemsToLineItems(items, 11);
  // Read from persisted JSONB columns first, then fall back to computed values
  const companyInfo = po.companyInfo ?? DEFAULT_COMPANY;
  const orderInfo = po.orderInfo ?? {
    poDate: po.date ? new Date(po.date).toISOString().slice(0, 10) : null,
    poNumber: po.number ?? '',
    docReference: po.docReference ?? '',
  };
  const client = po._client;
  const vendorInfo = po.vendorInfo ?? {
    vendorName: client?.companyName ?? po.supplierName ?? '',
    phone: client?.phone ?? po.vendorPhone ?? '',
    pic: client?.pic ?? po.vendorPic ?? null,
  };
  const approval = po.approval ?? DEFAULT_APPROVAL;

  return {
    id: `PO-${po.id}`,
    clientId: po.clientId ?? null,
    projectId: po.projectId ?? null,
    companyInfo,
    orderInfo,
    vendorInfo,
    lineItems,
    paymentProcedure: po.paymentProcedure ?? '',
    otherTerms: po.otherTerms ?? '',
    approval,
    status: po.status ?? 'DRAFT',
    createdAt: po.createdAt?.toISOString?.() ?? null,
    updatedAt: po.updatedAt?.toISOString?.() ?? null,
  };
}

export function fromDocSchema(body) {
  if (!body) return {};
  const lineItems = body.lineItems ?? [];
  const items = lineItemsToItems(lineItems);
  const subtotal = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
  const tax = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice * 0.11), 0);
  const grandTotal = subtotal + tax;

  // Null-safe defaults for JSONB fields — never pass null to DB
  const companyInfo = body.companyInfo ?? undefined;
  const orderInfo = body.orderInfo ?? undefined;
  const vendorInfo = body.vendorInfo ?? undefined;
  const approval = body.approval ?? undefined;

  const m = {
    items,
    subtotal: String(subtotal),
    tax: String(tax),
    grandTotal: String(grandTotal),
    ...(body.status != null ? { status: body.status } : {}),
    ...(companyInfo ? { companyInfo } : {}),
    ...(orderInfo ? { orderInfo } : {}),
    ...(vendorInfo ? { vendorInfo } : {}),
    ...(approval ? { approval } : {}),
    ...(body.paymentProcedure != null ? { paymentProcedure: body.paymentProcedure } : {}),
    ...(body.otherTerms != null ? { otherTerms: body.otherTerms } : {}),
  };

  if (body.orderInfo) {
    if (body.orderInfo.poNumber) m.number = body.orderInfo.poNumber;
    if (body.orderInfo.poDate) m.date = new Date(body.orderInfo.poDate);
  }
  if (body.clientId != null) m.clientId = body.clientId;
  if (body.projectId != null) m.projectId = body.projectId;
  if (body.vendorInfo?.vendorName) m.supplierName = body.vendorInfo.vendorName;
  if (body.vendorInfo?.phone) m.vendorPhone = body.vendorInfo.phone;
  if (body.vendorInfo?.pic) m.vendorPic = body.vendorInfo.pic;

  return m;
}
