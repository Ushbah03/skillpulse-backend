const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfill() {
  console.log('Backfilling courseTitle for existing LearningEnrollment rows...\n');
  const enrollments = await prisma.learningEnrollment.findMany({
    include: { course: true }
  });

  let count = 0;
  for (const en of enrollments) {
    if (en.course?.title) {
      await prisma.learningEnrollment.update({
        where: { id: en.id },
        data: { courseTitle: en.course.title }
      });
      console.log(`Updated enrollment ${en.id} -> courseTitle: "${en.course.title}"`);
      count++;
    }
  }

  console.log(`\nBackfill complete! Updated ${count} / ${enrollments.length} enrollment rows.`);
  await prisma.$disconnect();
}

backfill().catch(console.error);
