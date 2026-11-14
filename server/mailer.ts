import nodemailer from "nodemailer";

// Wysyłka przez SMTP (konto contact@novopix.uk). Zmienne: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (opcjonalnie SMTP_FROM, SMTP_SECURE).
// Gdy brak konfiguracji, nic nie jest wysyłane, a panel pokazuje uczciwy stan „SMTP nie skonfigurowane”.

export function smtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function smtpFrom(): string {
  return process.env.SMTP_FROM || process.env.SMTP_USER || "contact@novopix.uk";
}

function transport() {
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
}

export interface MailInput {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>;
}

export async function sendMail(input: MailInput): Promise<{ ok: true; messageId: string } | { ok: false; reason: "not_configured" | "failed"; error?: string }> {
  if (!smtpConfigured()) return { ok: false, reason: "not_configured" };
  try {
    const info = await transport().sendMail({
      from: `NovoPix <${smtpFrom()}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
      replyTo: input.replyTo,
      attachments: input.attachments,
    });
    return { ok: true, messageId: String(info.messageId || "") };
  } catch (e: any) {
    return { ok: false, reason: "failed", error: String(e?.message || e).slice(0, 300) };
  }
}

// Plik .eml do pobrania (bez SMTP): budowany lokalnie, nic nie jest wysyłane.
export async function buildEml(input: MailInput): Promise<string> {
  const t = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: "unix" });
  const info: any = await t.sendMail({
    from: `NovoPix <${smtpFrom()}>`,
    to: input.to,
    subject: input.subject,
    text: input.text,
    replyTo: input.replyTo,
    attachments: input.attachments,
  });
  return info.message.toString("utf-8");
}

export const alertRecipient = () => process.env.ALERT_EMAIL || "contact@novopix.uk";
