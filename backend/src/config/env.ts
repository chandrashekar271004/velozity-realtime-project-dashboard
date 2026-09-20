import 'dotenv/config';
import { z } from 'zod';
const schema=z.object({DATABASE_URL:z.string().min(1),PORT:z.coerce.number().default(5000),CLIENT_URL:z.string().url(),JWT_ACCESS_SECRET:z.string().min(32),JWT_REFRESH_SECRET:z.string().min(32),ACCESS_TOKEN_TTL:z.string().default('15m'),REFRESH_TOKEN_TTL_DAYS:z.coerce.number().default(7),NODE_ENV:z.enum(['development','test','production']).default('development')});
export const env=schema.parse(process.env);
