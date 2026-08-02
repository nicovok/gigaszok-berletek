import nodemailer from "nodemailer";
import { config } from "./config";
// @ts-ignore
import footerPath from "./email-footer.png" with { type: "file" };
// @ts-ignore
import logoPath from "./email-logo.png" with { type: "file" };

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false,
  auth: { user: config.smtp.user, pass: config.smtp.pass },
});

async function loadAssets() {
  return {
    footer: Buffer.from(await Bun.file(footerPath).arrayBuffer()),
    logo: Buffer.from(await Bun.file(logoPath).arrayBuffer()),
  };
}

let assets: Awaited<ReturnType<typeof loadAssets>>;

export async function initEmailAssets() {
  assets = await loadAssets();
}

/*
 * Base email template
 * ───────────────────
 * Layout:
 *   - Blue header (#2C39A2) with centered logo (100px)
 *   - White content area (padding 24px 40px 40px)
 *       • "Kedves [name]!" greeting
 *       • body HTML
 *       • "Üdv, A Gigászok csapata" sign-off
 *   - Footer image (full width)
 *
 * Usage: pass rendered inner HTML to template(), attach logo + footer CIDs.
 * To add a new email type, create a sendXxxEmail() function below.
 */
function template(greeting: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <tr>
          <td bgcolor="#2C39A2" style="background:#2C39A2;padding:24px 40px;text-align:center;">
            <img src="cid:logo" width="100" style="display:inline-block;width:100px;" />
          </td>
        </tr>
        <tr>
          <td bgcolor="#ffffff" style="background:#ffffff;padding:24px 40px 40px;">
            <p style="color:#1B2B6B;font-size:18px;font-weight:600;margin:0 0 16px;">${greeting}</p>
            ${body}
            <p style="margin:24px 0 0;color:#333;font-size:15px;line-height:1.6;">
              Üdv,<br/>A Gigászok csapata
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <img src="cid:footer" width="600" style="display:block;width:100%;max-width:600px;" />
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const defaultAttachments = () => [
  { filename: "logo.png", content: assets.logo, cid: "logo" },
  { filename: "footer.png", content: assets.footer, cid: "footer" },
];

function viewButton(passUrl: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
    <tr><td align="center">
      <a href="${passUrl}" style="display:inline-block;background:#2C39A2;color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.01em;">Bérlet megtekintése</a>
    </td></tr>
  </table>`;
}

function sessionColors(n: number) {
  if (n === 0) return { bg: "#8b1a2a", accent: "#ff6b7a", label: "rgba(255,255,255,0.65)" };
  if (n <= 3)  return { bg: "#7a3200", accent: "#ffaa55", label: "rgba(255,255,255,0.65)" };
  return               { bg: "#1e3d6b", accent: "#7ba8e0", label: "rgba(255,255,255,0.65)" };
}

function sessionBox(n: number, title: string, subtitle?: string): string {
  const { bg, accent, label } = sessionColors(n);
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" style="border-radius:14px;overflow:hidden;min-width:200px;">
        <tr>
          <td align="center" bgcolor="${bg}" style="background:${bg};padding:28px 48px 24px;border-radius:14px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:${label};letter-spacing:0.18em;text-transform:uppercase;">${title}</p>
            <p style="margin:0;font-size:72px;font-weight:900;color:#ffffff;line-height:1;font-family:Georgia,'Times New Roman',serif;">${n}</p>
            <p style="margin:6px 0 0;font-size:13px;font-weight:600;color:${accent};letter-spacing:0.1em;text-transform:uppercase;">alkalom</p>
            ${subtitle ? `<p style="margin:10px 0 0;font-size:12px;color:rgba(255,255,255,0.55);">${subtitle}</p>` : ""}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>`;
}

function twoSessionBoxes(left: { n: number; title: string }, right: { n: number; title: string }): string {
  const l = sessionColors(left.n);
  const r = sessionColors(right.n);
  const cell = (c: typeof l, n: number, title: string) =>
    `<td align="center" width="48%" bgcolor="${c.bg}" style="background:${c.bg};padding:22px 20px 20px;border-radius:12px;">
      <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:${c.label};letter-spacing:0.16em;text-transform:uppercase;">${title}</p>
      <p style="margin:0;font-size:60px;font-weight:900;color:#ffffff;line-height:1;font-family:Georgia,'Times New Roman',serif;">${n}</p>
      <p style="margin:5px 0 0;font-size:12px;font-weight:600;color:${c.accent};letter-spacing:0.1em;text-transform:uppercase;">alkalom</p>
    </td>`;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr>
      ${cell(l, left.n, left.title)}
      <td width="4%"></td>
      ${cell(r, right.n, right.title)}
    </tr>
  </table>`;
}

export async function sendPassCreatedEmail(opts: {
  to: string;
  parentName: string;
  childName: string;
  sessions: number;
  passUrl: string;
}) {
  await transporter.sendMail({
    from: config.smtp.from,
    to: opts.to,
    subject: `Bérleted létrejött – ${opts.childName}`,
    html: template(
      `Kedves ${opts.parentName}!`,
      `<p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 4px;">
        <strong>${opts.childName}</strong> bérlete sikeresen létrehozásra került.
      </p>
      ${sessionBox(opts.sessions, "Elérhető alkalmak")}
      ${viewButton(opts.passUrl)}`,
    ),
    attachments: defaultAttachments(),
  });
}

export async function sendPassToppedUpEmail(opts: {
  to: string;
  parentName: string;
  childName: string;
  addedSessions: number;
  remainingSessions: number;
  passUrl: string;
}) {
  await transporter.sendMail({
    from: config.smtp.from,
    to: opts.to,
    subject: `Bérleted feltöltve – ${opts.childName}`,
    html: template(
      `Kedves ${opts.parentName}!`,
      `<p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 4px;">
        <strong>${opts.childName}</strong> bérlete feltöltésre került.
      </p>
      ${twoSessionBoxes(
        { n: opts.addedSessions, title: "Feltöltve" },
        { n: opts.remainingSessions, title: "Új egyenleg" },
      )}
      ${viewButton(opts.passUrl)}`,
    ),
    attachments: defaultAttachments(),
  });
}

export async function sendSessionDeductedEmail(opts: {
  to: string;
  parentName: string;
  childName: string;
  sessionName: string;
  remainingSessions: number;
  passUrl: string;
}) {
  await transporter.sendMail({
    from: config.smtp.from,
    to: opts.to,
    subject: `Alkalom levonva – ${opts.childName}`,
    html: template(
      `Kedves ${opts.parentName}!`,
      `<p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 8px;">
        Rögzítettük, hogy <strong>${opts.childName}</strong> részt vett a következő alkalmon:
      </p>
      <p style="color:#2C39A2;font-size:16px;font-weight:600;margin:0 0 4px;padding:10px 16px;background:#f0f2fa;border-radius:6px;">
        ${opts.sessionName}
      </p>
      ${sessionBox(opts.remainingSessions, "Hátralévő alkalmak", opts.remainingSessions === 0 ? "Ideje feltölteni a bérletet!" : opts.remainingSessions <= 3 ? "Hamarosan elfogy a bérlet." : undefined)}
      ${viewButton(opts.passUrl)}`,
    ),
    attachments: defaultAttachments(),
  });
}
