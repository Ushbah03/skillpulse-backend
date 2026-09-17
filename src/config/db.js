import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  console.error("FATAL: DATABASE_URL is not set in environment variables.");
}
const connectionString = (rawUrl || '').replace(/^["']|["']$/g, '').trim();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionString
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export default prisma;
