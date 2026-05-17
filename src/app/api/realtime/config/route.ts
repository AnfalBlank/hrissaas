/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { requireSession } from "@/server/auth/session";
import { ok, handleError } from "@/server/api/respond";

/** Returns the auth payload the client should pass to socket.io. */
export async function GET() {
  try {
    const session = await requireSession();
    return ok({
      companyId: session.companyId,
      role: session.role,
      userId: session.sub,
      employeeId: session.employeeId,
      path: "/api/socket",
    });
  } catch (e) {
    return handleError(e);
  }
}
