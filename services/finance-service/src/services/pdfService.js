import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Shared helpers ────────────────────────────────────────────────────────────

/**
 * Strips control characters (newlines, tabs, etc.) from a string so
 * pdf-lib's WinAnsi encoder does not throw on 0x000a, 0x000d, etc.
 */
function sanitizeText(text) {
  if (text == null) return '';
  return String(text)
    .replace(/\r?\n/g, ' ')
    .replace(/[\x00-\x09\x0b-\x1f\x7f]/g, '');
}

/**
 * Wraps a long text into multiple lines based on max width.
 * Pre-splits on newline characters so multi-line strings render as separate lines.
 */
function wrapText(rawText, font, fontSize, maxWidth) {
  if (!rawText) return [''];
  const paragraphs = String(rawText).split(/\r?\n/);
  const allLines = [];
  for (const para of paragraphs) {
    const words = para.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
      const test = currentLine ? `${currentLine} ${word}` : word;
      if (font.widthOfTextAtSize(test, fontSize) <= maxWidth) {
        currentLine = test;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    allLines.push(...(lines.length ? lines : ['']));
  }
  return allLines.length ? allLines : [''];
}

/**
 * Convert a number into Indonesian words (Terbilang).
 */
function terbilangId(angka) {
  const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  if (angka === 0) return 'Nol';
  const helper = (n) => {
    if (n < 12) return bilangan[n];
    if (n < 20) return helper(n - 10) + ' Belas';
    if (n < 100) return helper(Math.floor(n / 10)) + ' Puluh ' + helper(n % 10);
    if (n < 200) return 'Seratus ' + helper(n - 100);
    if (n < 1000) return helper(Math.floor(n / 100)) + ' Ratus ' + helper(n % 100);
    if (n < 2000) return 'Seribu ' + helper(n - 1000);
    if (n < 1000000) return helper(Math.floor(n / 1000)) + ' Ribu ' + helper(n % 1000);
    if (n < 1000000000) return helper(Math.floor(n / 1000000)) + ' Juta ' + helper(n % 1000000);
    if (n < 1000000000000) return helper(Math.floor(n / 1000000000)) + ' Miliar ' + helper(n % 1000000000);
    if (n < 1000000000000000) return helper(Math.floor(n / 1000000000000)) + ' Triliun ' + helper(n % 1000000000000);
    return '';
  };
  return helper(Math.floor(angka)).trim().replace(/\s+/g, ' ');
}

/**
 * Format a number as Indonesian Rupiah string (e.g. "196.500.000").
 */
function formatRupiah(num) {
  return Math.floor(Number(num || 0)).toLocaleString('id-ID');
}

/**
 * Format a date string into Indonesian locale (e.g. "09 Juli 2025").
 */
function formatTanggal(dateStr) {
  if (!dateStr) return '-';
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return `${String(d.getDate()).padStart(2, '0')} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Quotation PDF ─────────────────────────────────────────────────────────────

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

// ─── Invoice PDF ───────────────────────────────────────────────────────────────

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

  // Bank Info
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

// ─── Purchase Order PDF ────────────────────────────────────────────────────────

export const generatePurchaseOrderPDF = async (po) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const boldItalicFont = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  const margin = 50;
  const rightEdge = width - margin;
  const contentWidth = rightEdge - margin;
  const grayColor = rgb(0.45, 0.45, 0.45);
  const darkBg = rgb(0.15, 0.15, 0.15);
  const lightGray = rgb(0.93, 0.93, 0.93);
  const redColor = rgb(0.8, 0, 0);

  // ── Extract PO data ──────────────────────────────────────────────────────────
  const companyInfo = po.companyInfo ?? {
    companyName: 'PT ALUGRA DIGITAL INDONESIA',
    address: 'Gedung Thamrin City Lantai 6 Unit 7A, JL. Thamrin Boulevard, Desa/Kelurahan Kebon Melati, Kec. Tanah Abang Kota Adm. Jakarta Pusat, Provinsi DKI 10320',
    phone: '',
  };
  const orderInfo = po.orderInfo ?? {
    poDate: po.date ? new Date(po.date).toISOString().slice(0, 10) : null,
    poNumber: po.number ?? '',
    docReference: '',
  };
  const vendorInfo = po.vendorInfo ?? {
    vendorName: po.supplierName ?? '',
    phone: '',
    pic: null,
  };
  const approval = po.approval ?? { position: '', name: '', signatureUrl: '' };
  const items = Array.isArray(po.items) ? po.items : [];

  let y = height - 45;

  // ── 1. LOGO – centered at top ────────────────────────────────────────────────
  let logoImage = null;
  try {
    const logoPath = path.join(__dirname, '..', 'assets', 'alugra_logo.png');
    const logoPng = readFileSync(logoPath);
    logoImage = await pdfDoc.embedPng(logoPng);
  } catch (_) { /* logo not found – degrade gracefully */ }

  const LOGO_H = 55;
  if (logoImage) {
    const dims = logoImage.scale(LOGO_H / logoImage.height);
    const logoX = (width - dims.width) / 2;
    page.drawImage(logoImage, { x: logoX, y: y - dims.height, width: dims.width, height: dims.height });
    y -= dims.height + 18;
  } else {
    const fallback = (companyInfo.companyName || 'ALUGRA').toUpperCase();
    const fw = boldFont.widthOfTextAtSize(fallback, 18);
    page.drawText(fallback, { x: (width - fw) / 2, y, size: 18, font: boldFont, color: grayColor });
    y -= 30;
  }

  // ── 2. Separator + "Purchase Order" right-aligned title ──────────────────────
  page.drawLine({ start: { x: margin, y }, end: { x: rightEdge, y }, thickness: 1, color: grayColor });
  y -= 22;

  const titleStr = 'Purchase Order';
  const titleSize = 18;
  const titleW = boldFont.widthOfTextAtSize(titleStr, titleSize);
  page.drawText(titleStr, { x: rightEdge - titleW, y, size: titleSize, font: boldFont });
  y -= 30;

  // ── 3. Two-column: recipient (left) | order info (right) ─────────────────────
  const leftX = margin;
  const infoLabelX = 360;
  const infoColonX = 418;

  const recipientStartY = y;

  // Left: Kepada Yth
  page.drawText('Kepada Yth,', { x: leftX, y, size: 10, font: italicFont, color: grayColor });
  y -= 16;

  const recName = sanitizeText(vendorInfo.vendorName || '-');
  page.drawText(recName, { x: leftX, y, size: 11, font: boldFont });
  y -= 14;

  const clientAddress = sanitizeText(po._client?.address ?? vendorInfo.address ?? '');
  if (clientAddress) {
    const addrLines = wrapText(clientAddress, font, 9, 270);
    for (const line of addrLines) {
      page.drawText(line, { x: leftX, y, size: 9, font, color: grayColor });
      y -= 12;
    }
  }

  // Right: order metadata
  let rightY = recipientStartY;
  const drawInfoRow = (label, value, vFont, vColor) => {
    page.drawText(label, { x: infoLabelX, y: rightY, size: 9, font });
    page.drawText(': ' + sanitizeText(value || '-'), {
      x: infoColonX, y: rightY, size: 9,
      font: vFont ?? font,
      color: vColor ?? rgb(0, 0, 0),
    });
    rightY -= 14;
  };
  drawInfoRow('PO Date', formatTanggal(orderInfo.poDate));
  drawInfoRow('PO Number', orderInfo.poNumber || po.number || '-', boldFont);
  if (orderInfo.docReference) drawInfoRow('Doc Reference', orderInfo.docReference);
  if (vendorInfo.pic?.name) drawInfoRow('PIC', vendorInfo.pic.name);

  y = Math.min(y, rightY) - 20;

  // ── 4. Items Table ────────────────────────────────────────────────────────────
  const COL_NO = margin;
  const COL_DESC = margin + 28;
  const COL_QTY = 320;
  const COL_PRICE = 400;
  const COL_TOTAL = rightEdge;
  const TH_SIZE = 9;
  const TR_SIZE = 9;

  // Header row
  const headerH = 22;
  page.drawRectangle({ x: margin, y: y - headerH + 6, width: contentWidth, height: headerH, color: darkBg });
  const hY = y - 10;
  page.drawText('No', { x: COL_NO + 4, y: hY, size: TH_SIZE, font: boldFont, color: rgb(1, 1, 1) });
  page.drawText('Description', { x: COL_DESC + 4, y: hY, size: TH_SIZE, font: boldFont, color: rgb(1, 1, 1) });
  page.drawText('QTY', { x: COL_QTY + 4, y: hY, size: TH_SIZE, font: boldFont, color: rgb(1, 1, 1) });
  page.drawText('Price', { x: COL_PRICE + 4, y: hY, size: TH_SIZE, font: boldFont, color: rgb(1, 1, 1) });
  const ltHeaderW = boldFont.widthOfTextAtSize('Line Total', TH_SIZE);
  page.drawText('Line Total', { x: COL_TOTAL - ltHeaderW - 4, y: hY, size: TH_SIZE, font: boldFont, color: rgb(1, 1, 1) });
  y -= headerH + 4;

  // Data rows
  let grandTotal = 0;
  items.forEach((item, idx) => {
    const qty = Number(item.quantity ?? item.qty ?? 1);
    const price = Number(item.unitPrice ?? item.price ?? 0);
    const lineTotal = Number(item.total ?? qty * price);
    grandTotal += lineTotal;

    const desc = sanitizeText(item.description ?? item.itemDescription ?? '-');
    const descLines = wrapText(desc, font, TR_SIZE, COL_QTY - COL_DESC - 10);
    const rowH = Math.max(descLines.length * 13 + 6, 20);

    // Alternate row shading
    if (idx % 2 === 0) {
      page.drawRectangle({ x: margin, y: y - rowH + 6, width: contentWidth, height: rowH, color: lightGray });
    }

    const rowY = y - 10;
    page.drawText(String(idx + 1), { x: COL_NO + 4, y: rowY, size: TR_SIZE, font });

    let descY = rowY;
    for (const line of descLines) {
      page.drawText(line, { x: COL_DESC + 4, y: descY, size: TR_SIZE, font });
      descY -= 13;
    }

    const unit = sanitizeText(item.unit ?? 'Unit');
    page.drawText(`${qty} ${unit}`, { x: COL_QTY + 4, y: rowY, size: TR_SIZE, font });
    page.drawText(`Rp  ${formatRupiah(price)}`, { x: COL_PRICE + 4, y: rowY, size: TR_SIZE, font });

    const ltStr = `Rp  ${formatRupiah(lineTotal)}`;
    const ltStrW = font.widthOfTextAtSize(ltStr, TR_SIZE);
    page.drawText(ltStr, { x: COL_TOTAL - ltStrW - 4, y: rowY, size: TR_SIZE, font });

    y -= rowH;
  });

  // ── 5. TOTAL row ──────────────────────────────────────────────────────────────
  const TOTAL_H = 22;
  page.drawRectangle({ x: COL_PRICE - 5, y: y - TOTAL_H + 6, width: rightEdge - COL_PRICE + 5, height: TOTAL_H, color: darkBg });
  const totalY = y - 10;
  page.drawText('TOTAL', { x: COL_PRICE, y: totalY, size: 9, font: boldFont, color: rgb(1, 1, 1) });

  const gtValue = Number(po.grandTotal || grandTotal || 0);
  const gtStr = `Rp  ${formatRupiah(gtValue)}`;
  const gtStrW = boldFont.widthOfTextAtSize(gtStr, 10);
  page.drawText(gtStr, { x: rightEdge - gtStrW - 4, y: totalY, size: 10, font: boldFont, color: rgb(1, 1, 1) });
  y -= TOTAL_H + 18;

  // ── 6. Terbilang ─────────────────────────────────────────────────────────────
  const terbLabel = 'Terbilang: ';
  const terbLabelW = boldFont.widthOfTextAtSize(terbLabel, 10);
  page.drawText(terbLabel, { x: margin, y, size: 10, font: boldFont });
  const terbFull = `${terbilangId(Math.floor(gtValue))} rupiah`;
  const terbLines = wrapText(terbFull, italicFont, 10, rightEdge - margin - terbLabelW);
  let terbY = y;
  for (const line of terbLines) {
    page.drawText(sanitizeText(line), { x: margin + terbLabelW, y: terbY, size: 10, font: italicFont });
    terbY -= 14;
  }
  y = terbY - 14;

  // ── 7. Note ───────────────────────────────────────────────────────────────────
  page.drawText('Note:', { x: margin, y, size: 9, font: boldFont });
  y -= 14;
  const defaultNote = 'No. Purchase Order (PO) harus dicantumkan dalam Nota/Invoice/Kwitansi';
  const noteText = sanitizeText(po.paymentProcedure || po.otherTerms || defaultNote);
  const noteLines = wrapText(`1.  ${noteText}`, font, 9, contentWidth - 20);
  for (const line of noteLines) {
    page.drawText(sanitizeText(line), { x: margin + 16, y, size: 9, font });
    y -= 12;
  }
  y -= 24;

  // ── 8. Signature – right-aligned ─────────────────────────────────────────────
  const sigX = rightEdge - 160;
  const signerName = sanitizeText(approval.name || '');
  const signerPos = sanitizeText(approval.position || '');

  page.drawText('Hormat kami,', { x: sigX, y, size: 10, font: italicFont });
  y -= 20;

  if (signerName) {
    const nameW = boldFont.widthOfTextAtSize(signerName, 10);
    page.drawText(signerName, { x: sigX, y, size: 10, font: boldFont });
    page.drawLine({ start: { x: sigX, y: y - 2 }, end: { x: sigX + nameW, y: y - 2 }, thickness: 0.8 });
    y -= 14;
  }
  if (signerPos) {
    page.drawText(signerPos, { x: sigX, y, size: 9, font });
    y -= 14;
  }

  // ── 9. Footer: small logo + company name + address ───────────────────────────
  const FOOTER_Y = 55;
  page.drawLine({ start: { x: margin, y: FOOTER_Y + 18 }, end: { x: rightEdge, y: FOOTER_Y + 18 }, thickness: 0.5, color: lightGray });

  let footerTextX = margin;
  if (logoImage) {
    const SMALL_LOGO_H = 24;
    const sDims = logoImage.scale(SMALL_LOGO_H / logoImage.height);
    page.drawImage(logoImage, { x: margin, y: FOOTER_Y - 6, width: sDims.width, height: sDims.height });
    footerTextX = margin + sDims.width + 10;
  }

  const footerCompany = sanitizeText(companyInfo.companyName || 'PT ALUGRA DIGITAL INDONESIA');
  page.drawText(footerCompany, { x: footerTextX, y: FOOTER_Y + 6, size: 8, font: boldFont, color: grayColor });

  const footerAddr = sanitizeText(companyInfo.address || '');
  if (footerAddr) {
    const footerLines = wrapText(footerAddr, font, 7, rightEdge - footerTextX);
    let fy = FOOTER_Y - 4;
    for (const fl of footerLines) {
      page.drawText(fl, { x: footerTextX, y: fy, size: 7, font, color: grayColor });
      fy -= 9;
    }
  }

  return await pdfDoc.save();
};

// ─── BAST PDF ──────────────────────────────────────────────────────────────────

export const generateBASTPDF = async (bast) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 10;
  let y = height - 50;

  page.drawText('BERITA ACARA SERAH TERIMA (BAST)', { x: 50, y, size: 18, font: boldFont });
  y -= 30;
  const cover = bast.coverInfo ?? {};
  page.drawText(`Job Offer: ${cover.jobOffer ?? '-'}`, { x: 50, y, size: fontSize, font });
  y -= 15;
  page.drawText(`Company: ${cover.companyName ?? '-'}`, { x: 50, y, size: fontSize, font });
  y -= 15;
  page.drawText(`Month: ${cover.bastMonth ?? '-'}`, { x: 50, y, size: fontSize, font });
  y -= 30;
  const docInfo = bast.documentInfo ?? {};
  page.drawText(`BAST No: ${docInfo.bastNumber ?? '-'}`, { x: 50, y, size: fontSize, font });
  y -= 15;
  page.drawText(`Date: ${docInfo.bastDate ?? '-'}`, { x: 50, y, size: fontSize, font });
  y -= 15;
  page.drawText(`Related: ${docInfo.relatedPoOrInvoice ?? '-'}`, { x: 50, y, size: fontSize, font });
  y -= 40;
  const delivering = bast.deliveringParty ?? {};
  page.drawText('Delivering Party:', { x: 50, y, size: fontSize, font: boldFont });
  y -= 15;
  page.drawText(`${delivering.name ?? '-'} | ${delivering.position ?? '-'} | ${delivering.company ?? '-'}`, { x: 50, y, size: fontSize, font });
  y -= 30;
  const receiving = bast.receivingParty ?? {};
  page.drawText('Receiving Party:', { x: 50, y, size: fontSize, font: boldFont });
  y -= 15;
  page.drawText(`${receiving.name ?? '-'} | ${receiving.position ?? '-'} | ${receiving.company ?? '-'}`, { x: 50, y, size: fontSize, font });

  return await pdfDoc.save();
};

// ─── Tax Type PDF ───────────────────────────────────────────────────────────────

export const generateTaxTypePDF = async (taxType) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 10;
  let y = height - 50;

  page.drawText('TAX TYPE', { x: 50, y, size: 18, font: boldFont });
  y -= 30;
  page.drawText(`Code: ${taxType.code ?? '-'}`, { x: 50, y, size: fontSize, font });
  y -= 15;
  page.drawText(`Name: ${taxType.name ?? '-'}`, { x: 50, y, size: fontSize, font });
  y -= 15;
  page.drawText(`Rate: ${taxType.rate ?? 0}%`, { x: 50, y, size: fontSize, font });
  y -= 15;
  page.drawText(`Category: ${taxType.category ?? '-'}`, { x: 50, y, size: fontSize, font });
  y -= 15;
  if (taxType.description) {
    page.drawText(`Description: ${taxType.description}`, { x: 50, y, size: fontSize, font });
    y -= 15;
  }
  if (taxType.regulation) {
    page.drawText(`Regulation: ${taxType.regulation}`, { x: 50, y, size: fontSize, font });
    y -= 15;
  }

  return await pdfDoc.save();
};

// ─── Proposal Penawaran PDF ─────────────────────────────────────────────────────

export const generateProposalPenawaranPDF = async (proposal) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 10;
  let y = height - 50;

  page.drawText('PROPOSAL PENAWARAN', { x: 50, y, size: 18, font: boldFont });
  y -= 25;
  const cover = proposal.coverInfo ?? {};
  page.drawText(`Job Offer: ${cover.jobOffer ?? '-'}`, { x: 50, y, size: fontSize, font });
  y -= 15;
  page.drawText(`Company: ${cover.companyName ?? '-'}`, { x: 50, y, size: fontSize, font });
  y -= 15;
  page.drawText(`Proposal No: ${proposal.proposalNumber ?? '-'}`, { x: 50, y, size: fontSize, font });
  y -= 25;
  const client = proposal.clientInfo ?? {};
  page.drawText(`Client: ${client.clientName ?? '-'}`, { x: 50, y, size: fontSize, font });
  y -= 25;
  page.drawText('Items:', { x: 50, y, size: fontSize, font: boldFont });
  y -= 15;
  const items = Array.isArray(proposal.items) ? proposal.items : [];
  items.forEach((item) => {
    const desc = (item.description || '-').substring(0, 50);
    const qty = item.quantity ?? 1;
    const price = item.unitPrice ?? item.totalPrice ?? 0;
    const total = item.totalPrice ?? qty * price;
    page.drawText(`${desc} | Qty: ${qty} | ${parseFloat(total).toLocaleString()}`, { x: 50, y, size: 9, font });
    y -= 12;
  });
  y -= 10;
  page.drawText(`Total: ${parseFloat(proposal.totalEstimatedCost || 0).toLocaleString()} ${proposal.currency ?? 'IDR'}`, { x: 50, y, size: fontSize, font: boldFont });
  y -= 15;
  page.drawText(`In Words: ${proposal.totalEstimatedCostInWords ?? '-'}`, { x: 50, y, size: 9, font });

  return await pdfDoc.save();
};
