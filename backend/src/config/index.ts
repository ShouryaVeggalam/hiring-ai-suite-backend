import { loadEnv, type Env } from './env';

let cached: Env | null = null;

export function getConfig(): Env {
  if (!cached) {
    cached = loadEnv();
  }
  return cached;
}

export function resetConfigForTests(): void {
  cached = null;
}

export * from './env';
