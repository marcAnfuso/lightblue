import nodemailer from "nodemailer";
import type { Author } from "./posts";

const SITE_URL = process.env.SITE_URL || "https://lightblue.vercel.app";

function getTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

/**
 * Avisa al OTRO cuando alguien deja un recuerdo.
 * Si author = marc → le escribe a Cele, y viceversa.
 * Es fire-and-forget: si falta config o falla, no rompe nada.
 */
export async function notifyNewPost({
  author,
  hasImage,
  text,
}: {
  author: Author;
  hasImage: boolean;
  text?: string;
}): Promise<void> {
  const transport = getTransport();
  if (!transport) return;

  const fromName = author === "cele" ? "Cele" : "Marc";
  const toEmail =
    author === "cele" ? process.env.MARC_EMAIL : process.env.CELE_EMAIL;
  if (!toEmail) return;

  const clean = text?.trim();
  const peek = clean
    ? `“${clean.slice(0, 160)}${clean.length > 160 ? "…" : ""}”`
    : hasImage
      ? "una fotito 📷"
      : "algo";

  const subject = `${fromName} te dejó algo en la paginita 🩵`;

  const html = `
  <div style="background:#aed5f2;padding:28px 16px;font-family:Georgia,serif;">
    <div style="max-width:460px;margin:0 auto;background:#fcfdff;border-radius:6px;padding:28px 26px;box-shadow:0 20px 50px -25px rgba(20,60,90,.5);">
      <p style="margin:0 0 6px;color:#3a72a0;font-size:14px;letter-spacing:.04em;">una paginita para Cele</p>
      <h1 style="margin:0 0 14px;color:#1f4f74;font-size:26px;line-height:1.2;">${fromName} te dejó un recuerdito 🩵</h1>
      <p style="margin:0 0 18px;color:#1f4f74;font-size:18px;line-height:1.5;">${peek}</p>
      <a href="${SITE_URL}" style="display:inline-block;background:#1f4f74;color:#fff;text-decoration:none;padding:12px 22px;border-radius:4px;font-family:Arial,sans-serif;font-size:15px;">ir a verlo →</a>
      <p style="margin:22px 0 0;color:#3a72a0;font-size:13px;">hecha con cariño.</p>
    </div>
  </div>`;

  const plain = `${fromName} dejó ${peek} en la paginita.\nEntrá a verlo: ${SITE_URL}`;

  await transport.sendMail({
    from: `"paginita de Cele" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject,
    html,
    text: plain,
  });
}
