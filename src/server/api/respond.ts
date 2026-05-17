import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "@/server/auth/session";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(status: number, message: string, extra?: any) {
  return NextResponse.json(
    { ok: false, error: message, ...(extra ? { extra } : {}) },
    { status }
  );
}

export function handleError(e: unknown) {
  if (e instanceof HttpError) return fail(e.status, e.message);
  if (e instanceof ZodError) {
    return fail(400, "Validation failed", e.flatten());
  }
  console.error("[API ERROR]", e);
  const msg = e instanceof Error ? e.message : "Internal error";
  return fail(500, msg);
}
