export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiFailure {
  success: false;
  error: {
    code?: string;
    message: string;
    details?: unknown;
  };
}

export function ok<T>(data: T, meta?: Record<string, unknown>): ApiSuccess<T> {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

export function fail(message: string, code?: string, details?: unknown): ApiFailure {
  return {
    success: false,
    error: { message, code, details },
  };
}
