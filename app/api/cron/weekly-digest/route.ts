import { NextResponse } from "next/server";
import { dispatchResumenSemanal, flushAllPending } from "@/lib/notifications/dispatch";

// Always run fresh; never cache the digest endpoint.
export const dynamic = "force-dynamic";

/**
 * Weekly digest, triggered by Vercel Cron (see vercel.json). Vercel attaches
 * `Authorization: Bearer ${CRON_SECRET}` automatically when CRON_SECRET is set.
 * Also flushes any pending rank/badge notifications as a safety net.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const resumen = await dispatchResumenSemanal();
  await flushAllPending();

  return NextResponse.json({ ok: true, resumen });
}
