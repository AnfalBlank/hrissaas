import { cookies } from "next/headers";
import { verifyJwt, type JwtPayload } from "./jwt";
import { SESSION_COOKIE } from "./constants";

export { SESSION_COOKIE };

export async function getSession(): Promise<JwtPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return await verifyJwt(token);
}

export async function requireSession(): Promise<JwtPayload> {
  const s = await getSession();
  if (!s) throw new HttpError(401, "Unauthorized");
  return s;
}

export async function requireRole(roles: string[]): Promise<JwtPayload> {
  const s = await requireSession();
  if (!roles.includes(s.role)) throw new HttpError(403, "Forbidden");
  return s;
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
