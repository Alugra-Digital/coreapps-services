import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const generateQuotationPDF = async (quotation, client) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fontSize = 10;
  let y = height - 50;

  // Header
  page.drawText('PT ALUGRA INDONESIA', { x: 50, y, size: 18, font: boldFont, color: rgb(0, 0.2, 0.6) });
  y -= 20;
  page.drawText('Menara 165, 4th Floor, Jl. TB Simatupang Kav. 1', { x: 50, y, size: fontSize, font });
  y -= 15;
  page.drawText('Jakarta Selatan, 12560', { x: 50, y, size: fontSize, font });
  y -= 30;

  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  y -= 30;

  // Title
  page.drawText('QUOTATION', { x: 50, y, size: 24, font: boldFont });
  page.drawText(`No: ${quotation.number}`, { x: width - 200, y, size: fontSize, font });
  y -= 20;
  page.drawText(`Date: ${new Date(quotation.date).toLocaleDateString()}`, { x: width - 200, y, size: fontSize, font });
  y -= 40;

  // Client Info
  page.drawText('To:', { x: 50, y, size: fontSize, font: boldFont });
  y -= 15;
  page.drawText(client.name, { x: 50, y, size: fontSize, font });
  y -= 15;
  if (client.address) page.drawText(client.address, { x: 50, y, size: fontSize, font });
  y -= 40;

  // Scope of Work
  if (quotation.scopeOfWork) {
    page.drawText('Scope of Work:', { x: 50, y, size: fontSize, font: boldFont });
    y -= 15;
    // Simple text wrapping would be needed here for long text, keeping it simple for now
    page.drawText(quotation.scopeOfWork.substring(0, 100) + (quotation.scopeOfWork.length > 100 ? '...' : ''), { x: 50, y, size: fontSize, font });
    y -= 30;
  }

  // Table Header
  const col1 = 50;
  const col2 = 300;
  const col3 = 400;
  const col4 = 500;

  page.drawText('Item Description', { x: col1, y, size: fontSize, font: boldFont });
  page.drawText('Qty', { x: col2, y, size: fontSize, font: boldFont });
  page.drawText('Price', { x: col3, y, size: fontSize, font: boldFont });
  page.drawText('Total', { x: col4, y, size: fontSize, font: boldFont });
  y -= 10;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1 });
  y -= 20;

  // Items
  quotation.items.forEach((item) => {
    page.drawText(item.description, { x: col1, y, size: fontSize, font });
    page.drawText(item.qty.toString(), { x: col2, y, size: fontSize, font });
    page.drawText(parseFloat(item.price).toLocaleString(), { x: col3, y, size: fontSize, font });
    page.drawText((item.qty * item.price).toLocaleString(), { x: col4, y, size: fontSize, font });
    y -= 20;
  });

  y -= 10;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1 });
  y -= 30;

  // Totals
  const totalX = 400;
  page.drawText('Subtotal:', { x: totalX, y, size: fontSize, font });
  page.drawText(parseFloat(quotation.subtotal).toLocaleString(), { x: 500, y, size: fontSize, font });
  y -= 20;
  page.drawText('PPN (11%):', { x: totalX, y, size: fontSize, font });
  page.drawText(parseFloat(quotation.ppn).toLocaleString(), { x: 500, y, size: fontSize, font });
  y -= 20;
  page.drawText('Grand Total:', { x: totalX, y, size: 12, font: boldFont });
  page.drawText(parseFloat(quotation.grandTotal).toLocaleString(), { x: 500, y, size: 12, font: boldFont });

  return await pdfDoc.save();
};

export const generateInvoicePDF = async (invoice, client) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fontSize = 10;
  let y = height - 50;

  // Header
  page.drawText('PT ALUGRA INDONESIA', { x: 50, y, size: 18, font: boldFont, color: rgb(0, 0.2, 0.6) });
  y -= 20;
  page.drawText('Menara 165, 4th Floor, Jl. TB Simatupang Kav. 1', { x: 50, y, size: fontSize, font });
  y -= 15;
  page.drawText('Jakarta Selatan, 12560', { x: 50, y, size: fontSize, font });
  y -= 30;

  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  y -= 30;

  // Title
  page.drawText('INVOICE', { x: 50, y, size: 24, font: boldFont });
  page.drawText(`No: ${invoice.number}`, { x: width - 200, y, size: fontSize, font });
  y -= 20;
  page.drawText(`Date: ${new Date(invoice.date).toLocaleDateString()}`, { x: width - 200, y, size: fontSize, font });
  y -= 15;
  if (invoice.dueDate) {
    page.drawText(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, { x: width - 200, y, size: fontSize, font });
    y -= 5;
  }
  y -= 40;

  // Client Info
  page.drawText('Bill To:', { x: 50, y, size: fontSize, font: boldFont });
  y -= 15;
  page.drawText(client.name, { x: 50, y, size: fontSize, font });
  y -= 15;
  if (client.address) page.drawText(client.address, { x: 50, y, size: fontSize, font });
  y -= 40;

  // Table Header
  const col1 = 50;
  const col2 = 300;
  const col3 = 400;
  const col4 = 500;

  page.drawText('Item Description', { x: col1, y, size: fontSize, font: boldFont });
  page.drawText('Qty', { x: col2, y, size: fontSize, font: boldFont });
  page.drawText('Price', { x: col3, y, size: fontSize, font: boldFont });
  page.drawText('Total', { x: col4, y, size: fontSize, font: boldFont });
  y -= 10;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1 });
  y -= 20;

  // Items
  invoice.items.forEach((item) => {
    page.drawText(item.description, { x: col1, y, size: fontSize, font });
    page.drawText(item.qty.toString(), { x: col2, y, size: fontSize, font });
    page.drawText(parseFloat(item.price).toLocaleString(), { x: col3, y, size: fontSize, font });
    page.drawText((item.qty * item.price).toLocaleString(), { x: col4, y, size: fontSize, font });
    y -= 20;
  });

  y -= 10;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1 });
  y -= 30;

  // Totals
  const totalX = 400;
  page.drawText('Subtotal:', { x: totalX, y, size: fontSize, font });
  page.drawText(parseFloat(invoice.subtotal).toLocaleString(), { x: 500, y, size: fontSize, font });
  y -= 20;
  page.drawText('PPN (11%):', { x: totalX, y, size: fontSize, font });
  page.drawText(parseFloat(invoice.ppn).toLocaleString(), { x: 500, y, size: fontSize, font });
  y -= 20;
  if (invoice.pph && parseFloat(invoice.pph) > 0) {
    page.drawText('PPh:', { x: totalX, y, size: fontSize, font });
    page.drawText(parseFloat(invoice.pph).toLocaleString(), { x: 500, y, size: fontSize, font });
    y -= 20;
  }
  page.drawText('Grand Total:', { x: totalX, y, size: 12, font: boldFont });
  page.drawText(parseFloat(invoice.grandTotal).toLocaleString(), { x: 500, y, size: 12, font: boldFont });

  // Bank Info (Static for now)
  y -= 50;
  page.drawText('Payment Info:', { x: 50, y, size: fontSize, font: boldFont });
  y -= 15;
  page.drawText('Bank BCA', { x: 50, y, size: fontSize, font });
  y -= 15;
  page.drawText('A/C: 1234567890', { x: 50, y, size: fontSize, font });
  y -= 15;
  page.drawText('A/N: PT Alugra Indonesia', { x: 50, y, size: fontSize, font });

  return await pdfDoc.save();
};
