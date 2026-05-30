import type { Request } from 'express';

export function getRequestMeta(req: Request) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined) ||
    req.ip ||
    req.socket.remoteAddress;

  return {
    ip: ip ?? undefined,
    userAgent: req.headers['user-agent'],
  };
}
