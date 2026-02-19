import { faker } from '@faker-js/faker';

function generateInvoiceItems() {
  const count = faker.number.int({ min: 1, max: 10 });
  return Array.from({ length: count }, () => ({
    description: faker.commerce.productName(),
    quantity: faker.number.int({ min: 1, max: 100 }),
    unitPrice: faker.number.int({ min: 10000, max: 5000000 }),
    unit: faker.helpers.arrayElement(['pcs', 'unit', 'box', 'kg', 'meter', 'set'])
  }));
}

export function generateInvoices(clients, count = 500) {
  if (!clients || clients.length === 0) {
    throw new Error('Clients array is required for invoice generation');
  }
  
  return Array.from({ length: count }, (_, i) => {
    const client = faker.helpers.arrayElement(clients);
    const items = generateInvoiceItems();
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxRate = 0.11; // PPN 11%
    const tax = subtotal * taxRate;
    const issueDate = faker.date.past({ years: 1 });
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + faker.number.int({ min: 7, max: 60 }));
    
    const statuses = ['DRAFT', 'ISSUED', 'PARTIAL', 'PAID', 'OVERDUE'];
    const weights = [0.05, 0.15, 0.10, 0.60, 0.10]; // Mostly paid invoices
    let status = faker.helpers.weightedArrayElement(
      statuses.map((s, idx) => ({ weight: weights[idx], value: s }))
    );
    
    // If due date is past, increase chance of overdue
    if (new Date() > dueDate && status === 'ISSUED') {
      status = faker.helpers.arrayElement(['OVERDUE', 'PAID']);
    }
    
    return {
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(i + 1).padStart(5, '0')}`,
      clientId: client.id,
      issueDate,
      dueDate,
      status,
      subtotal,
      tax,
      discount: faker.number.int({ min: 0, max: subtotal * 0.1 }), // Up to 10% discount
      total: subtotal + tax,
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
      items,
      paymentTerms: faker.helpers.arrayElement(['Net 30', 'Net 60', 'Due on Receipt', 'Net 15']),
      currency: 'IDR',
      createdAt: issueDate,
      updatedAt: faker.date.between({ from: issueDate, to: new Date() })
    };
  });
}

export function generateQuotations(clients, count = 200) {
  if (!clients || clients.length === 0) {
    throw new Error('Clients array is required for quotation generation');
  }
  
  return Array.from({ length: count }, (_, i) => {
    const client = faker.helpers.arrayElement(clients);
    const items = generateInvoiceItems();
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.11;
    const validUntil = faker.date.future({ years: 0.25 }); // Valid for ~3 months
    
    return {
      quotationNumber: `QUO-${new Date().getFullYear()}-${String(i + 1).padStart(5, '0')}`,
      clientId: client.id,
      issueDate: faker.date.recent({ days: 30 }),
      validUntil,
      status: faker.helpers.arrayElement(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']),
      subtotal,
      tax,
      total: subtotal + tax,
      items,
      notes: faker.lorem.paragraph(),
      createdAt: faker.date.recent({ days: 30 })
    };
  });
}

export function generatePayments(invoices, count = 300) {
  return Array.from({ length: count }, (_, i) => {
    const invoice = faker.helpers.arrayElement(invoices.filter(inv => ['ISSUED', 'PARTIAL', 'PAID'].includes(inv.status)));
    if (!invoice) return null;
    
    const paymentDate = faker.date.between({ 
      from: invoice.issueDate, 
      to: new Date(invoice.dueDate.getTime() + 30 * 24 * 60 * 60 * 1000) 
    });
    
    return {
      paymentNumber: `PAY-${new Date().getFullYear()}-${String(i + 1).padStart(5, '0')}`,
      invoiceId: invoice.id,
      amount: invoice.status === 'PARTIAL' 
        ? faker.number.float({ min: invoice.total * 0.3, max: invoice.total * 0.8, precision: 0.01 })
        : invoice.total,
      paymentDate,
      paymentMethod: faker.helpers.arrayElement(['Bank Transfer', 'Credit Card', 'Cash', 'Cheque', 'Virtual Account']),
      reference: `REF-${faker.string.alphanumeric(10).toUpperCase()}`,
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.2 }),
      createdAt: paymentDate
    };
  }).filter(Boolean);
}
