import "server-only";
import { Resend } from "resend";

/**
 * Isolated email layer (Resend). The API key is server-only and never reaches
 * the client. Sends NEVER throw: a mail failure must not break the user action
 * (publishing, commenting) that triggered it — failures are logged and counted.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

// Resend's shared test sender works without verifying a domain (handy in dev).
// In production set EMAIL_FROM to a verified address, e.g. "Radar I+D <radar@doinglobal.com>".
const DEFAULT_FROM = "Radar I+D <onboarding@resend.dev>";
const BATCH_LIMIT = 100; // Resend's max emails per batch call.

/** True when email is configured. Lets callers skip work when it's not. */
export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Sends a batch of (already personalized) emails in as few API calls as
 * possible. Returns how many were accepted by Resend. Never throws.
 */
export async function sendBatch(messages: EmailMessage[]): Promise<number> {
  if (messages.length === 0) return 0;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY no configurada — se omite el envío de mails.");
    return 0;
  }
  const from = process.env.EMAIL_FROM?.trim() || DEFAULT_FROM;
  const resend = new Resend(apiKey);

  let sent = 0;
  for (const group of chunk(messages, BATCH_LIMIT)) {
    try {
      const { error } = await resend.batch.send(
        group.map((m) => ({ from, to: m.to, subject: m.subject, html: m.html })),
      );
      if (error) {
        console.error(`[email] Resend respondió con error: ${error.message}`);
        continue;
      }
      sent += group.length;
    } catch (e) {
      console.error("[email] Envío falló:", e instanceof Error ? e.message : e);
    }
  }
  return sent;
}

/** Convenience single-recipient send. Returns true if accepted. */
export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  return (await sendBatch([msg])) > 0;
}
