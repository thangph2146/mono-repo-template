import type { Request } from 'express';

const HEADER = 'x-user-id';

export function parseXUserId(req: Request): number | null {
  const raw = req.headers[HEADER];
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (s === undefined || s === null || String(s).trim() === '') {
    return null;
  }
  const n = Number.parseInt(String(s).trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}
