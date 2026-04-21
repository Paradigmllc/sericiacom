import { Resend } from "resend";

let cached: Resend | null = null;
function client(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("[email] RESEND_API_KEY not set");
  cached = new Resend(key);
  return cached;
}

const FROM = process.env.SERICIA_EMAIL_FROM || "Sericia <hello@sericia.com>";

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const result = await client().emails.send({
      from: FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      replyTo: args.replyTo,
    });
    if (result.error) {
      console.error("[email] resend error", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[email] send failed", msg, err);
    return { ok: false, error: msg };
  }
}

// ----- Email templates (inline-style HTML, Aesop aesthetic) -----

const wrap = (inner: string, preheader = "") => `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Sericia</title>
</head>
<body style="margin:0;padding:0;background:#f4f0e8;font-family:'Noto Sans',system-ui,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#2a2a27;">
  ${preheader ? `<div style="display:none;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f0e8;">
    <tr><td align="center" style="padding:48px 16px;">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e1d7;">
        <tr><td style="padding:40px 40px 24px 40px;border-bottom:1px solid #e5e1d7;">
          <div style="font-size:14px;letter-spacing:0.25em;text-transform:uppercase;color:#2a2a27;">Sericia</div>
        </td></tr>
        <tr><td style="padding:40px;">
          ${inner}
        </td></tr>
        <tr><td style="padding:24px 40px 32px 40px;border-top:1px solid #e5e1d7;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8a8578;">
          Sericia — Rescued Japanese Craft · Shipped from Kyoto
          <div style="margin-top:10px;letter-spacing:normal;text-transform:none;font-size:12px;">
            <a href="https://sericia.com" style="color:#5a5546;text-decoration:underline;">sericia.com</a>
            &nbsp;·&nbsp;
            <a href="https://sericia.com/shipping" style="color:#5a5546;text-decoration:underline;">Shipping</a>
            &nbsp;·&nbsp;
            <a href="https://sericia.com/refund" style="color:#5a5546;text-decoration:underline;">Refunds</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const h1 = (t: string) =>
  `<h1 style="font-size:24px;font-weight:400;margin:0 0 20px 0;letter-spacing:-0.01em;color:#2a2a27;line-height:1.2;">${t}</h1>`;
const p = (t: string) =>
  `<p style="font-size:15px;line-height:1.65;margin:0 0 16px 0;color:#5a5546;">${t}</p>`;
const label = (t: string) =>
  `<div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8a8578;margin:0 0 8px 0;">${t}</div>`;
const btn = (href: string, text: string) =>
  `<a href="${href}" style="display:inline-block;background:#2a2a27;color:#f4f0e8;padding:14px 28px;text-decoration:none;font-size:13px;letter-spacing:0.12em;">${text}</a>`;

export function orderConfirmationEmail(opts: {
  full_name: string;
  order_id: string;
  items: Array<{ name: string; quantity: number; unit_price_usd: number }>;
  total_usd: number;
  shipping: {
    address_line1: string;
    address_line2?: string | null;
    city: string;
    region?: string | null;
    postal_code: string;
    country_code: string;
  };
}): string {
  const rows = opts.items
    .map(
      (i) => `<tr>
      <td style="padding:12px 0;border-bottom:1px solid #e5e1d7;font-size:14px;">${i.name} <span style="color:#8a8578;">× ${i.quantity}</span></td>
      <td style="padding:12px 0;border-bottom:1px solid #e5e1d7;font-size:14px;text-align:right;">$${(i.unit_price_usd * i.quantity).toFixed(0)}</td>
    </tr>`,
    )
    .join("");
  const addrLine2 = opts.shipping.address_line2 ? opts.shipping.address_line2 + "<br>" : "";
  const region = opts.shipping.region ? ", " + opts.shipping.region : "";
  const inner = `
    ${h1("Order confirmed")}
    ${p(`Thank you, ${opts.full_name}. We have received your order and will ship within 48 hours from our Kyoto workshop. An EMS tracking number will follow as soon as your parcel is handed to the carrier.`)}
    <div style="margin:24px 0 8px 0;">${label("Order")}</div>
    <div style="font-size:13px;color:#5a5546;margin-bottom:20px;font-family:ui-monospace,'SF Mono',Consolas,monospace;">${opts.order_id}</div>
    <table width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #e5e1d7;margin-bottom:16px;">${rows}
      <tr><td style="padding:16px 0 0 0;font-size:15px;font-weight:500;">Total</td>
          <td style="padding:16px 0 0 0;font-size:15px;font-weight:500;text-align:right;">$${opts.total_usd.toFixed(0)} USD</td></tr>
    </table>
    ${label("Ship to")}
    <div style="font-size:14px;line-height:1.7;margin-bottom:28px;color:#2a2a27;">
      ${opts.full_name}<br>
      ${opts.shipping.address_line1}<br>
      ${addrLine2}${opts.shipping.city}${region} ${opts.shipping.postal_code}<br>
      ${opts.shipping.country_code}
    </div>
    ${btn("https://sericia.com/account/orders", "View order")}
  `;
  return wrap(inner, `Your Sericia order ${opts.order_id.slice(0, 8)} is confirmed.`);
}

export function shippingNotificationEmail(opts: {
  full_name: string;
  order_id: string;
  tracking_number: string;
  tracking_carrier: string;
  tracking_url?: string;
}): string {
  const trackUrl =
    opts.tracking_url ||
    `https://trackings.post.japanpost.jp/services/srv/search?requestNo1=${encodeURIComponent(opts.tracking_number)}&locale=en`;
  const inner = `
    ${h1("Your parcel is on its way")}
    ${p(`${opts.full_name}, your order has just been handed to ${opts.tracking_carrier}. Expect delivery in 5–10 business days depending on your customs clearance.`)}
    ${label("Tracking")}
    <div style="font-size:15px;margin-bottom:8px;font-family:ui-monospace,'SF Mono',Consolas,monospace;">${opts.tracking_number}</div>
    <div style="font-size:13px;color:#8a8578;margin-bottom:28px;">${opts.tracking_carrier}</div>
    ${btn(trackUrl, "Track parcel")}
    <div style="margin-top:28px;">${p("Duties and taxes, if any, are collected by your local customs at the door.")}</div>
  `;
  return wrap(inner, `Your Sericia order has shipped.`);
}

export function welcomeEmail(opts: { full_name: string | null }): string {
  const name = opts.full_name?.split(" ")[0] || "there";
  const inner = `
    ${h1("Welcome to Sericia")}
    ${p(`Hello ${name}. Sericia is a small operation rescuing end-of-run Japanese craft — single-origin tea, barrel-aged miso, sun-dried mushrooms — from producers who would otherwise discard surplus. Every drop is limited, every parcel is packed by hand in Kyoto.`)}
    ${p("The current selection is already open and ships EMS worldwide.")}
    ${btn("https://sericia.com/products", "Shop the collection")}
  `;
  return wrap(inner, `Welcome to Sericia — rescued Japanese craft, shipped from Kyoto.`);
}
