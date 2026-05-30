import type { Response } from 'express';
import { getConfig } from '../config';
import { parseDurationToMs } from './parseDuration';

export function setRefreshTokenCookie(res: Response, refreshToken: string) {
  const config = getConfig();
  const maxAge = parseDurationToMs(config.JWT_REFRESH_TTL);

  res.cookie(config.JWT_REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: config.COOKIE_SECURE,
    sameSite: config.COOKIE_SAME_SITE,
    maxAge,
    path: '/',
  });
}

export function clearRefreshTokenCookie(res: Response) {
  const config = getConfig();
  res.clearCookie(config.JWT_REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: config.COOKIE_SECURE,
    sameSite: config.COOKIE_SAME_SITE,
    path: '/',
  });
}
