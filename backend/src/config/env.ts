import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  SMTP_HOST: z.string().default('smtp.ethereal.email'),
  SMTP_PORT: z.string().default('587').transform((val) => parseInt(val, 10)),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('Mailora <noreply@mailora.local>'),
  WORKER_CONCURRENCY: z.string().default('5').transform((val) => Math.max(1, parseInt(val, 10) || 5)),
  MIN_SEND_DELAY_MS: z.string().default('1000').transform((val) => Math.max(0, parseInt(val, 10) || 1000)),
  MAX_EMAILS_PER_HOUR: z.string().default('100').transform((val) => Math.max(1, parseInt(val, 10) || 100)),
  ELASTICSEARCH_NODE: z.string().url('ELASTICSEARCH_NODE must be a valid URL').optional(),
  ELASTICSEARCH_API_KEY: z.string().min(1, 'ELASTICSEARCH_API_KEY cannot be empty').optional(),
  BULL_BOARD_USER: z.string().min(1, 'BULL_BOARD_USER is required'),
  BULL_BOARD_PASS: z.string().min(1, 'BULL_BOARD_PASS is required'),
  SLACK_CLIENT_ID: z.string().optional(),
  SLACK_CLIENT_SECRET: z.string().optional(),
  SLACK_REDIRECT_URI: z.string().default('http://localhost:5000/api/slack/oauth/callback'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters long'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().default('http://localhost:5000/api/auth/google/callback'),
});


const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
