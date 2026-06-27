const { Resend } = require("resend");
const { buildInvoiceUrl } = require("./invoiceLink");

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatRupee(amount) {
  const value = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatWhatsapp(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.startsWith("+") ? raw : `+${raw}`;
}

function formatAddress(address) {
  const line1 = escapeHtml(address?.line1 || "");
  const line2 = address?.line2 ? `, ${escapeHtml(address.line2)}` : "";
  const city = escapeHtml(address?.city || "");
  const state = escapeHtml(address?.state || "");
  const pincode = escapeHtml(address?.pincode || "");
  return `${line1}${line2}<br>${city}, ${state} — ${pincode}`;
}

// ─── Buyer Confirmation Email ────────────────────────────────────────────────

async function sendBuyerConfirmation(order, pdfBuffer, invoiceUrl) {
  try {
    const email = order?.customer?.email || "";
    if (!email) return;
    if (!resend) { console.error("Resend not configured: RESEND_API_KEY missing"); return; }
    const from = process.env.RESEND_FROM_EMAIL || "";
    if (!from) { console.error("Resend not configured: RESEND_FROM_EMAIL missing"); return; }

    const orderId = order?._id?.toString() || "";
    const last5 = orderId.slice(-5) || "00000";
    const name = escapeHtml(order?.customer?.name || "there");
    const firstName = name.split(" ")[0];
    let invoiceLink = "";
    try {
      invoiceLink = buildInvoiceUrl(orderId);
    } catch (err) {
      console.error("Invoice link not configured:", err?.message || err);
    }
    const fallbackItem = {
      name: order?.productName || "your item",
      size: order?.size || "",
      originalPrice: order?.originalPrice ?? order?.salePrice ?? 0,
      salePrice: order?.salePrice ?? 0,
      quantity: 1,
    };

    const items = Array.isArray(order?.items) && order.items.length
      ? order.items
      : [fallbackItem];

    const totals = items.reduce(
      (acc, item) => {
        const qty = Number(item?.quantity || 1);
        const original = Number(item?.originalPrice ?? item?.salePrice ?? 0) * qty;
        const sale = Number(item?.salePrice ?? 0) * qty;
        acc.original += original;
        acc.sale += sale;
        return acc;
      },
      { original: 0, sale: 0 }
    );

    const savedAmount = Math.max(0, totals.original - totals.sale);
    const itemsRows = items
      .map((item) => {
        const name = escapeHtml(item?.name || "Item");
        const size = escapeHtml(item?.size || "N/A");
        const qty = Number(item?.quantity || 1);
        const sale = Number(item?.salePrice ?? 0) * qty;
        return `
                      <tr>
                        <td style="font-size:13px;color:#555555;padding:5px 0;">${name} × ${qty}</td>
                        <td style="font-size:13px;font-weight:600;color:#111111;text-align:right;padding:5px 0;">${size}</td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#aaaaaa;padding:0 0 8px 0;">Paid</td>
                        <td style="font-size:12px;color:#aaaaaa;text-align:right;padding:0 0 8px 0;">${formatRupee(sale)}</td>
                      </tr>`;
      })
      .join("");
    const paymentId = escapeHtml(order?.razorpayPaymentId || "");
    const whatsapp = formatWhatsapp(process.env.ADMIN_WHATSAPP || "");
    const whatsappUrl = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : "";

    const attachments = [];
    if (pdfBuffer) {
      attachments.push({
        filename: `Invoice-MBM-${last5}.pdf`,
        content: pdfBuffer,
      });
    }

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Order Confirmed — thrift by Muskan</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background:#111111;border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
              <div style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">thrift by Muskan</div>
              <div style="color:#aaaaaa;font-size:12px;margin-top:4px;">pre-loved, curated with love</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px 32px;">

              <!-- Greeting -->
              <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#111111;">
                Hey ${firstName}! Your order is confirmed 🎉
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#555555;">
                We're so excited for you. Here's everything about your order.
              </p>

              <!-- Order card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:10px;border:1px solid #eeeeee;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:10px;font-weight:700;letter-spacing:0.12em;color:#aaaaaa;text-transform:uppercase;margin-bottom:12px;">Order Summary</div>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                      ${itemsRows}
                      <tr>
                        <td colspan="2" style="padding-top:10px;border-top:1px solid #eeeeee;"></td>
                      </tr>
                      <tr>
                        <td style="font-size:15px;font-weight:700;color:#111111;padding:4px 0;">Total Paid</td>
                        <td style="font-size:15px;font-weight:700;color:#111111;text-align:right;padding:4px 0;">${formatRupee(totals.sale)}</td>
                      </tr>
                      ${savedAmount > 0 ? `
                      <tr>
                        <td colspan="2" style="padding-top:8px;">
                          <span style="background:#dcfce7;color:#16a34a;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;">
                            You saved ${formatRupee(savedAmount)} ✦
                          </span>
                        </td>
                      </tr>` : ""}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Shipping address -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:10px;border:1px solid #eeeeee;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:10px;font-weight:700;letter-spacing:0.12em;color:#aaaaaa;text-transform:uppercase;margin-bottom:10px;">Shipping To</div>
                    <div style="font-size:13px;font-weight:600;color:#111111;margin-bottom:4px;">${escapeHtml(order?.customer?.name || "")}</div>
                    <div style="font-size:13px;color:#555555;line-height:1.7;">${formatAddress(order?.address || {})}</div>
                  </td>
                </tr>
              </table>

              <!-- Payment reference -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:10px;border:1px solid #eeeeee;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                      <div>
                        <div style="font-size:10px;font-weight:700;letter-spacing:0.12em;color:#aaaaaa;text-transform:uppercase;margin-bottom:6px;">Payment Reference</div>
                        <div style="font-family:'Courier New',monospace;font-size:12px;color:#555555;word-break:break-all;">${paymentId || "—"}</div>
                      </div>
                      <div style="margin-left:16px;flex-shrink:0;">
                        <span style="background:#dcfce7;color:#16a34a;font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px;border:1px solid #bbf7d0;">✓ Paid</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Invoice line -->
              ${invoiceLink ? `
              <p style="margin:0 0 24px;">
                <a href="${escapeHtml(invoiceLink)}" style="display:inline-block;background:#111111;color:#ffffff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">
                  Download Invoice →
                </a>
              </p>` : ""}

              <!-- Tracking link -->
              ${order?.shipment?.trackingUrl ? `
              <p style="margin:0 0 24px;">
                <a href="${escapeHtml(order.shipment.trackingUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">
                  Track Your Order →
                </a>
              </p>` : ""}

              <!-- Sign off -->
              <p style="margin:24px 0 8px;font-size:14px;color:#111111;">
                We'll keep you posted on your shipment. If you have any questions, just reach out 💬
              </p>
              ${whatsappUrl ? `
              <a href="${whatsappUrl}" style="display:inline-block;margin-top:8px;background:#25d366;color:#ffffff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">
                WhatsApp Us
              </a>` : ""}

              <p style="margin:28px 0 0;font-size:14px;color:#111111;">
                With love,<br>
                <strong>Muskan ✦</strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;border-top:1px solid #eeeeee;">
              <p style="margin:0;font-size:11px;color:#aaaaaa;">
                thrift by Muskan · Order #MBM-${last5}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

    await resend.emails.send({
      from,
      to: email,
      subject: `Your order is confirmed ✨ — thrift by Muskan`,
      html,
      attachments,
    });

  } catch (err) {
    console.error("Buyer confirmation email failed:", err);
  }
}

// ─── Admin Notification Email ────────────────────────────────────────────────

async function sendAdminNotification(order) {
  try {
    if (!resend) { console.error("Resend not configured: RESEND_API_KEY missing"); return; }
    const from = process.env.RESEND_FROM_EMAIL || "";
    if (!from) { console.error("Resend not configured: RESEND_FROM_EMAIL missing"); return; }
    const to = process.env.ADMIN_EMAIL || "";
    if (!to) { console.error("Admin email missing: ADMIN_EMAIL not configured"); return; }

    const fallbackItem = {
      name: order?.productName || "Item",
      size: order?.size || "",
      originalPrice: order?.originalPrice ?? order?.salePrice ?? 0,
      salePrice: order?.salePrice ?? 0,
      quantity: 1,
    };

    const items = Array.isArray(order?.items) && order.items.length
      ? order.items
      : [fallbackItem];

    const totals = items.reduce(
      (acc, item) => {
        const qty = Number(item?.quantity || 1);
        const original = Number(item?.originalPrice ?? item?.salePrice ?? 0) * qty;
        const sale = Number(item?.salePrice ?? 0) * qty;
        acc.original += original;
        acc.sale += sale;
        return acc;
      },
      { original: 0, sale: 0 }
    );

    const savedAmount = Math.max(0, totals.original - totals.sale);
    const itemCount = items.reduce((sum, item) => sum + Number(item?.quantity || 1), 0);
    const itemsRows = items
      .map((item) => {
        const name = escapeHtml(item?.name || "Item");
        const size = escapeHtml(item?.size || "N/A");
        const qty = Number(item?.quantity || 1);
        const sale = Number(item?.salePrice ?? 0) * qty;
        return `
                      <tr>
                        <td style="font-size:13px;color:#555555;padding:5px 0;">${name} × ${qty}</td>
                        <td style="font-size:13px;font-weight:600;color:#111111;text-align:right;padding:5px 0;">${size}</td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#aaaaaa;padding:0 0 8px 0;">Paid</td>
                        <td style="font-size:12px;color:#aaaaaa;text-align:right;padding:0 0 8px 0;">${formatRupee(sale)}</td>
                      </tr>`;
      })
      .join("");
    const buyer = order?.customer || {};
    const paymentId = escapeHtml(order?.razorpayPaymentId || "");
    const paidAt = order?.paidAt
      ? new Date(order.paidAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
      : new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    const invoiceUrl = order?.invoiceUrl ? escapeHtml(order.invoiceUrl) : "";
    const orderId = order?._id?.toString() || "";
    const last5 = orderId.slice(-5) || "00000";

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>New Sale — thrift by Muskan</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background:#111111;border-radius:12px 12px 0 0;padding:24px 32px;">
              <div style="color:#ffffff;font-size:16px;font-weight:700;">thrift by Muskan</div>
              <div style="color:#aaaaaa;font-size:11px;margin-top:2px;">admin notification</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:32px;">

              <!-- Alert -->
              <p style="margin:0 0 24px;font-size:20px;font-weight:700;color:#111111;">
                New sale! 🎉
              </p>

              <!-- Sale summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:10px;border:1px solid #eeeeee;margin-bottom:20px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:10px;font-weight:700;letter-spacing:0.12em;color:#aaaaaa;text-transform:uppercase;margin-bottom:12px;">What Sold</div>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${itemsRows}
                      <tr>
                        <td colspan="2" style="padding-top:10px;border-top:1px solid #eeeeee;"></td>
                      </tr>
                      <tr>
                        <td style="font-size:15px;font-weight:700;color:#111111;padding:4px 0;">Revenue</td>
                        <td style="font-size:15px;font-weight:700;color:#16a34a;text-align:right;padding:4px 0;">${formatRupee(totals.sale)}</td>
                      </tr>
                      ${savedAmount > 0 ? `
                      <tr>
                        <td style="font-size:12px;color:#aaaaaa;padding-top:4px;">MRP was ${formatRupee(totals.original)}</td>
                        <td style="font-size:12px;color:#aaaaaa;text-align:right;padding-top:4px;">Buyer saved ${formatRupee(savedAmount)}</td>
                      </tr>` : ""}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Buyer info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:10px;border:1px solid #eeeeee;margin-bottom:20px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:10px;font-weight:700;letter-spacing:0.12em;color:#aaaaaa;text-transform:uppercase;margin-bottom:12px;">Buyer</div>
                    <div style="font-size:14px;font-weight:600;color:#111111;margin-bottom:4px;">${escapeHtml(buyer.name || "—")}</div>
                    <div style="font-size:13px;color:#555555;margin-bottom:2px;">📞 ${escapeHtml(buyer.phone || "—")}</div>
                    ${buyer.email ? `<div style="font-size:13px;color:#555555;">✉️ ${escapeHtml(buyer.email)}</div>` : ""}
                  </td>
                </tr>
              </table>

              <!-- Ship to -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:10px;border:1px solid #eeeeee;margin-bottom:20px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:10px;font-weight:700;letter-spacing:0.12em;color:#aaaaaa;text-transform:uppercase;margin-bottom:10px;">Ship To</div>
                    <div style="font-size:13px;color:#111111;line-height:1.7;">${formatAddress(order?.address || {})}</div>
                  </td>
                </tr>
              </table>

              <!-- Payment -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:10px;border:1px solid #eeeeee;margin-bottom:20px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:10px;font-weight:700;letter-spacing:0.12em;color:#aaaaaa;text-transform:uppercase;margin-bottom:10px;">Payment</div>
                    <div style="font-family:'Courier New',monospace;font-size:12px;color:#555555;margin-bottom:8px;word-break:break-all;">${paymentId || "—"}</div>
                    <div style="font-size:12px;color:#aaaaaa;">Paid at: ${escapeHtml(paidAt)}</div>
                    <div style="margin-top:10px;">
                      <span style="background:#dcfce7;color:#16a34a;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;border:1px solid #bbf7d0;">✓ Confirmed</span>
                    </div>
                  </td>
                </tr>
              </table>

              ${invoiceUrl ? `
              <p style="margin:0;">
                <a href="${invoiceUrl}" style="display:inline-block;background:#111111;color:#ffffff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">
                  View Invoice →
                </a>
              </p>` : ""}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;border-radius:0 0 12px 12px;padding:16px 32px;text-align:center;border-top:1px solid #eeeeee;">
              <p style="margin:0;font-size:11px;color:#aaaaaa;">Order #MBM-${last5} · thrift by Muskan</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

    await resend.emails.send({
      from,
      to,
      subject: `New sale! 🎉 ${itemCount} items — ${formatRupee(totals.sale)}`,
      html,
    });

  } catch (err) {
    console.error("Admin notification email failed:", err);
  }
}

module.exports = { sendBuyerConfirmation, sendAdminNotification };