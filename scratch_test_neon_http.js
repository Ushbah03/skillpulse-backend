import { neon } from '@neondatabase/serverless';
import { PrismaNeonHttp } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const rawUrl = process.env.DATABASE_URL;
const connectionString = (rawUrl || '').replace(/^["']|["']$/g, '').trim();

console.log("Testing Neon HTTP Connection with URL:", connectionString);

async function main() {
  try {
    const adapter = new PrismaNeonHttp(connectionString);
    const prisma = new PrismaClient({ adapter });
    
    const count = await prisma.user.count();
    console.log("SUCCESS! Total Users count in Neon DB:", count);
    
    const users = await prisma.user.findMany({
      take: 5,
      select: { id: true, email: true, firstName: true, lastName: true, role: true }
    });
    console.log("Sample Users from DB:", users);
    await prisma.$disconnect();
  } catch (err) {
    console.error("HTTP Neon Error:", err);
  }
}

main();
