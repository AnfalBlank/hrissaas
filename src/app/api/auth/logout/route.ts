/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { SESSION_COOKIE } from "@/server/auth/session";
import { ok } from "@/server/api/respond";

export async function POST() {
  const res = ok({ message: "Logged out" });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
