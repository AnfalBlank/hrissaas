/**
 * Realtime emitter — wraps the global Socket.IO instance attached by
 * server.js. Safe no-op if Socket.IO isn't available (e.g., during build).
 */
type AnyPayload = Record<string, any>;

declare global {
  // eslint-disable-next-line no-var
  var __io__: any;
}

function getIo() {
  return globalThis.__io__ ?? null;
}

export function emitToCompany(
  companyId: string,
  event: string,
  payload: AnyPayload
) {
  const io = getIo();
  if (!io) return;
  io.to(`company:${companyId}`).emit(event, payload);
}

export function emitToAdmins(
  companyId: string,
  event: string,
  payload: AnyPayload
) {
  const io = getIo();
  if (!io) return;
  io.to(`admin:${companyId}`).emit(event, payload);
}
