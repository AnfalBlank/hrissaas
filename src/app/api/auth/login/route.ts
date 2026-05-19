/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { verifyPassword } from "@/server/auth/password";
import { signJwt } from "@/server/auth/jwt";
import { SESSION_COOKIE } from "@/server/auth/session";
import { audit } from "@/server/auth/audit";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetAttempts,
  hydrateFromRedis,
} from "@/server/auth/rate-limit";
import { ok, fail, handleError } from "@/server/api/respond";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const rateKey = `login:${ip}:${body.email.toLowerCase()}`;
    await hydrateFromRedis(rateKey);
    const rl = checkRateLimit(rateKey);
    if (!rl.allowed) {
      audit({
        action: "auth.login.blocked",
        details: {
          email: body.email,
          reason: "rate_limit",
          retryAfterSec: rl.retryAfterSec,
        },
        ip,
        userAgent: req.headers.get("user-agent"),
      });
      return fail(
        429,
        `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(
          (rl.retryAfterSec ?? 1800) / 60
        )} menit.`,
        { retryAfterSec: rl.retryAfterSec }
      );
    }

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, body.email));

    if (!user || !user.active) {
      const r = recordFailedAttempt(rateKey);
      audit({
        action: "auth.login.failed",
        details: {
          email: body.email,
          reason: "not_found_or_inactive",
          remaining: r.remaining,
          blocked: r.blocked,
        },
        ip,
        userAgent: req.headers.get("user-agent"),
      });
      return fail(401, "Email atau password salah");
    }
    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      const r = recordFailedAttempt(rateKey);
      audit({
        companyId: user.companyId,
        userId: user.id,
        action: "auth.login.failed",
        details: {
          email: body.email,
          reason: "wrong_password",
          remaining: r.remaining,
          blocked: r.blocked,
        },
        ip,
        userAgent: req.headers.get("user-agent"),
      });
      if (r.blocked) {
        return fail(
          429,
          `Terlalu banyak percobaan gagal. Akun terkunci ${Math.ceil(
            (r.retryAfterSec ?? 1800) / 60
          )} menit.`
        );
      }
      return fail(401, "Email atau password salah");
    }

    // Success — reset rate counter
    resetAttempts(rateKey);

    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.userId, user.id));

    const token = await signJwt({
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      employeeId: employee?.id,
    });

    await db
      .update(schema.users)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.users.id, user.id));

    audit({
      companyId: user.companyId,
      userId: user.id,
      action: "auth.login.success",
      details: { email: body.email },
      ip,
      userAgent: req.headers.get("user-agent"),
    });

    const res = ok({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
      employee: employee
        ? {
            id: employee.id,
            fullName: employee.fullName,
            employeeCode: employee.employeeCode,
            position: employee.position,
            division: employee.division,
            avatarUrl: employee.avatarUrl,
          }
        : null,
    });

    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    return handleError(e);
  }
}
