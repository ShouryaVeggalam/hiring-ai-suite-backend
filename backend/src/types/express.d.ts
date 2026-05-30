import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: {
        id: string;
        organizationId: string;
        email: string;
        role: Role;
      };
      tenant?: {
        organizationId: string;
      };
    }
  }
}

export {};
