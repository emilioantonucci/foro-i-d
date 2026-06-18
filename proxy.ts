import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renamed the "middleware" convention to "proxy".
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on all paths EXCEPT:
     * - Next internals (_next/static, _next/image)
     * - static files (fonts, assets, images, css)
     * - API routes (they guard themselves and must return JSON, not redirects)
     */
    "/((?!_next/static|_next/image|favicon.ico|fonts|assets|api|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|ttf|woff|woff2|css)).*)",
  ],
};
