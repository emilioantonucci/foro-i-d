import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Always run fresh; never cache the penalty endpoint.
export const dynamic = "force-dynamic";

/**
 * Daily inactivity penalty, triggered by Vercel Cron (see vercel.json).
 * Vercel attaches `Authorization: Bearer ${CRON_SECRET}` automatically when
 * CRON_SECRET is set. All the logic lives in apply_inactivity_penalty()
 * (migration 0010): −100 points after 15 idle days, recurring, floored at 0.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json(
      { ok: false, error: "No autorizado." },
      { status: 401 },
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("apply_inactivity_penalty");
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, penalizados: data?.length ?? 0 });
}
