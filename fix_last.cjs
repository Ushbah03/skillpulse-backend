const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixOne() {
  const res = await prisma.course.updateMany({
    where: {
      title: { contains: 'UI/UX Research', mode: 'insensitive' }
    },
    data: {
      externalUrl: 'https://www.youtube.com/embed/jwCmIBJ8Jtc'
    }
  });
  console.log(`Updated UI/UX Research course count: ${res.count}`);
  await prisma.$disconnect();
}

fixOne().catch(console.error);
