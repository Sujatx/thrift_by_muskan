'use strict';
const PDFDocument = require('pdfkit');

const F = { regular: 'Helvetica', bold: 'Helvetica-Bold', mono: 'Courier' };
const C = {
  ink: '#111111', muted: '#777777', faint: '#aaaaaa',
  border: '#eeeeee', borderDark: '#f1f1f1',
  green: '#16a34a', greenBg: '#dcfce7', addr: '#555555',
};
const M = { top: 48, bottom: 48, left: 48, right: 48 };

function formatDate(d) {
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
function formatRupee(n) {
  const v = Number.isFinite(Number(n)) ? Number(n) : 0;
  return `₹${v.toLocaleString('en-IN')}`;
}
function formatWhatsapp(v) {
  const s = String(v || '').trim();
  return s ? (s.startsWith('+') ? s : `+${s}`) : '';
}

function buildItems(order) {
  const fallback = [{
    name: order?.productName || 'Item',
    size: order?.size || '',
    originalPrice: order?.originalPrice ?? order?.salePrice ?? 0,
    salePrice: order?.salePrice ?? 0,
    quantity: 1,
  }];
  return Array.isArray(order?.items) && order.items.length ? order.items : fallback;
}

function calcTotals(items) {
  return items.reduce((acc, item) => {
    const qty = Number(item?.quantity || 1);
    acc.original += Number(item?.originalPrice ?? item?.salePrice ?? 0) * qty;
    acc.sale     += Number(item?.salePrice ?? 0) * qty;
    return acc;
  }, { original: 0, sale: 0 });
}

function hRule(doc, y, width, weight = 0.5, color = C.border) {
  doc.moveTo(M.left, y).lineTo(M.left + width, y)
     .lineWidth(weight).strokeColor(color).stroke();
}

async function generateInvoice(order) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: M,
      info: { Title: 'Invoice — thrift by Muskan', Author: 'thrift by Muskan' },
    });

    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try { buildInvoice(doc, order); }
    catch (err) { reject(err); return; }

    doc.end();
  });
}

function buildInvoice(doc, order) {
  const orderId  = order?._id?.toString() || '';
  const invoiceId = `MBM-${orderId.slice(-5) || '00000'}`;
  const today    = formatDate(new Date());
  const customer = order?.customer || {};
  const address  = order?.address  || {};
  const items    = buildItems(order);
  const totals   = calcTotals(items);
  const paymentId = order?.razorpayPaymentId || '';
  const whatsapp  = formatWhatsapp(process.env.ADMIN_WHATSAPP || '');

  const W = doc.page.width - M.left - M.right; // usable width

  // ── HEADER ───────────────────────────────────────────────────────────────
  const hTop = M.top;
  doc.font(F.bold).fontSize(20).fillColor(C.ink)
     .text('thrift by Muskan', M.left, hTop);
  doc.font(F.regular).fontSize(11).fillColor(C.muted)
     .text('pre-loved, curated with love', M.left, hTop + 26);

  doc.font(F.bold).fontSize(9).fillColor(C.muted)
     .text('INVOICE', M.left, hTop, { align: 'right', width: W });
  doc.font(F.bold).fontSize(15).fillColor(C.ink)
     .text(`#${invoiceId}`, M.left, hTop + 16, { align: 'right', width: W });
  doc.font(F.regular).fontSize(11).fillColor(C.muted)
     .text(today, M.left, hTop + 34, { align: 'right', width: W });

  hRule(doc, hTop + 58, W, 2, C.ink);

  // ── BILL TO ───────────────────────────────────────────────────────────────
  let y = hTop + 74;

  doc.font(F.bold).fontSize(9).fillColor(C.muted).text('BILL TO', M.left, y);
  y += 14;
  doc.font(F.bold).fontSize(13).fillColor(C.ink).text(customer.name || '', M.left, y);
  y += 18;
  doc.font(F.regular).fontSize(11).fillColor(C.addr);
  if (customer.phone) { doc.text(customer.phone, M.left, y); y += 15; }
  if (customer.email) { doc.text(customer.email, M.left, y); y += 15; }
  const line2  = address.line2 ? `, ${address.line2}` : '';
  doc.text(`${address.line1 || ''}${line2}`, M.left, y); y += 15;
  doc.text(`${address.city || ''}, ${address.state || ''} — ${address.pincode || ''}`, M.left, y);
  y += 20;

  hRule(doc, y, W);
  y += 16;

  // ── ITEMS TABLE ───────────────────────────────────────────────────────────
  doc.font(F.bold).fontSize(9).fillColor(C.muted).text('ORDER SUMMARY', M.left, y);
  y += 14;

  // Column layout (x offsets from M.left)
  const col = {
    desc:  { x: M.left,                  w: W * 0.34 },
    size:  { x: M.left + W * 0.34,       w: W * 0.10 },
    qty:   { x: M.left + W * 0.44,       w: W * 0.09 },
    mrp:   { x: M.left + W * 0.53,       w: W * 0.15 },
    paid:  { x: M.left + W * 0.68,       w: W * 0.16 },
    saved: { x: M.left + W * 0.84,       w: W * 0.16 },
  };

  hRule(doc, y, W, 2, C.ink);
  y += 8;

  doc.font(F.bold).fontSize(9).fillColor(C.muted);
  doc.text('DESCRIPTION', col.desc.x,  y, { width: col.desc.w });
  doc.text('SIZE',         col.size.x,  y, { width: col.size.w });
  doc.text('QTY',          col.qty.x,   y, { width: col.qty.w,  align: 'right' });
  doc.text('MRP',          col.mrp.x,   y, { width: col.mrp.w,  align: 'right' });
  doc.text('YOU PAID',     col.paid.x,  y, { width: col.paid.w, align: 'right' });
  doc.text('YOU SAVED',    col.saved.x, y, { width: col.saved.w, align: 'right' });
  y += 20;

  for (const item of items) {
    const qty      = Number(item?.quantity || 1);
    const original = Number(item?.originalPrice ?? item?.salePrice ?? 0) * qty;
    const sale     = Number(item?.salePrice ?? 0) * qty;
    const saved    = Math.max(0, original - sale);

    doc.font(F.bold).fontSize(12).fillColor(C.ink)
       .text(item?.name || 'Item', col.desc.x, y, { width: col.desc.w });
    doc.font(F.regular).fontSize(11).fillColor(C.ink)
       .text(item?.size || 'N/A',  col.size.x, y, { width: col.size.w })
       .text(String(qty),          col.qty.x,  y, { width: col.qty.w,  align: 'right' });
    doc.fillColor(C.faint)
       .text(formatRupee(original), col.mrp.x,   y, { width: col.mrp.w,   align: 'right' });
    doc.font(F.bold).fillColor(C.ink)
       .text(formatRupee(sale),     col.paid.x,  y, { width: col.paid.w,  align: 'right' });
    doc.fillColor(C.green)
       .text(formatRupee(saved),    col.saved.x, y, { width: col.saved.w, align: 'right' });

    y += 26;
    hRule(doc, y - 2, W, 0.5, C.borderDark);
  }

  // Total row — partial rule above the total box only
  const totalX = M.left + W - 220;
  doc.moveTo(totalX, y + 4).lineTo(M.left + W, y + 4)
     .lineWidth(2).strokeColor(C.ink).stroke();

  y += 16;
  doc.font(F.bold).fontSize(14).fillColor(C.ink)
     .text('Total Paid', totalX, y, { width: 110 })
     .text(formatRupee(totals.sale), totalX + 110, y, { width: 110, align: 'right' });

  y += 30;
  hRule(doc, y, W);
  y += 16;

  // ── PAYMENT ───────────────────────────────────────────────────────────────
  const halfW = W / 2;
  doc.font(F.bold).fontSize(9).fillColor(C.muted)
     .text('PAYMENT REFERENCE', M.left, y)
     .text('STATUS', M.left + halfW, y);

  y += 14;
  doc.font(F.mono).fontSize(11).fillColor(C.addr)
     .text(paymentId || '—', M.left, y, { width: halfW - 12 });

  const badgeX = M.left + halfW;
  doc.roundedRect(badgeX, y - 3, 66, 20, 10).fillColor(C.greenBg);
  doc.font(F.bold).fontSize(11).fillColor(C.green).text('✓ Paid', badgeX + 8, y + 1);

  y += 30;
  hRule(doc, y, W);
  y += 16;

  // ── FOOTER ────────────────────────────────────────────────────────────────
  doc.font(F.regular).fontSize(11).fillColor(C.muted)
     .text('Thank you for shopping with ', M.left, y, { continued: true })
     .font(F.bold).fillColor(C.ink).text('thrift by Muskan', { continued: true })
     .font(F.regular).fillColor(C.muted).text(' ❖');

  if (whatsapp) {
    y += 18;
    doc.font(F.regular).fontSize(11).fillColor(C.muted)
       .text('Questions? WhatsApp us at ', M.left, y, { continued: true })
       .font(F.bold).fillColor(C.ink).text(whatsapp);
  }
}

module.exports = { generateInvoice };
