import type { Request, Response } from 'express';
import { getConfig } from '../config';
import { authService } from '../services/auth.service';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/ApiResponse';
import { clearRefreshTokenCookie, setRefreshTokenCookie } from '../utils/cookie';

function sendAuthResponse(res: Response, result: Awaited<ReturnType<typeof authService.login>>) {
  setRefreshTokenCookie(res, result.refreshToken);
  res.status(200).json(
    ok({
      user: result.user,
      accessToken: result.tokens.accessToken,
      expiresIn: result.tokens.expiresIn,
    }),
  );
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body, req);
  setRefreshTokenCookie(res, result.refreshToken);
  res.status(201).json(
    ok({
      user: result.user,
      accessToken: result.tokens.accessToken,
      expiresIn: result.tokens.expiresIn,
    }),
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body, req);
  sendAuthResponse(res, result);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const config = getConfig();
  const refreshToken =
    req.cookies?.[config.JWT_REFRESH_COOKIE_NAME] ?? req.body?.refreshToken;

  if (!refreshToken || typeof refreshToken !== 'string') {
    throw ApiError.unauthorized('Refresh token required');
  }

  const result = await authService.refresh(refreshToken, req);
  sendAuthResponse(res, result);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.id) {
    await authService.logout(req.user.id, req);
  }
  clearRefreshTokenCookie(res);
  res.json(ok({ message: 'Logged out' }));
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body, req);
  res.json(
    ok({
      message: 'If an account exists for this email, a reset link has been sent.',
    }),
  );
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body, req);
  res.json(ok({ message: 'Password has been reset. Please log in again.' }));
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  res.json(ok({ user }));
});
