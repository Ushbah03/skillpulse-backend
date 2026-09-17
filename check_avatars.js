import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, firstName: true, lastName: true, avatarUrl: true }
  });
  console.log('Users count:', users.length);
  users.forEach(u => {
    console.log(`${u.firstName} ${u.lastName}: avatarUrl = ${u.avatarUrl}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
