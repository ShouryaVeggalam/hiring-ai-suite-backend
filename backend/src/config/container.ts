import 'reflect-metadata';
import { container } from 'tsyringe';
import { getPrisma } from './prisma';
import { getLogger } from './logger';

export const TOKENS = {
  Prisma: Symbol.for('Prisma'),
  Logger: Symbol.for('Logger'),
} as const;

export function registerContainer(): void {
  container.register(TOKENS.Prisma, { useValue: getPrisma() });
  container.register(TOKENS.Logger, { useValue: getLogger() });
}

export { container };
