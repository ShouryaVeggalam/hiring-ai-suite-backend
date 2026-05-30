import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_PREFIX: z.string().default('/api/v1'),
  APP_NAME: z.string().default('hiring-ai-suite'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  TRUST_PROXY: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1),
  DATABASE_POOL_SIZE: z.coerce.number().default(10),

  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_TLS: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  PASSWORD_RESET_TTL: z.string().default('30m'),
  BCRYPT_ROUNDS: z.coerce.number().min(10).max(14).default(12),
  JWT_REFRESH_COOKIE_NAME: z.string().default('refreshToken'),
  COOKIE_SECURE: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),
  APP_URL: z.string().url().default('http://localhost:4000'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().default(120),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(20),

  STORAGE_DRIVER: z.enum(['s3', 'local']).default('s3'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('hiring-ai-suite'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  S3_SIGNED_URL_TTL: z.coerce.number().default(900),
  UPLOAD_MAX_BYTES: z.coerce.number().default(10_485_760),
  UPLOAD_ALLOWED_MIME: z
    .string()
    .default(
      'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ),
  LOCAL_STORAGE_PATH: z.string().default('./uploads'),
  VIRUS_SCAN_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  QUEUE_PREFIX: z.string().default('hiring-ai'),
  QUEUE_DEFAULT_ATTEMPTS: z.coerce.number().default(3),
  QUEUE_DEFAULT_BACKOFF_MS: z.coerce.number().default(5000),
  WORKER_CONCURRENCY: z.coerce.number().default(5),

  AI_PROVIDER: z.enum(['mock', 'openai']).default('mock'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

  EMAIL_PROVIDER: z.enum(['console', 'smtp']).default('console'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('Hiring AI Suite <no-reply@example.com>'),

  WEBHOOK_SIGNING_SECRET: z.string().optional(),
  ORG_WEBHOOK_URL: z.string().url().optional(),

  METRICS_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  SWAGGER_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  REQUEST_TIMEOUT_MS: z.coerce.number().default(30_000),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Environment validation failed');
  }
  return parsed.data;
}
