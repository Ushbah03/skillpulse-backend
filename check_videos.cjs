const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();

function checkYoutubeVideo(videoId) {
  return new Promise((resolve) => {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        resolve({ valid: true, status: res.statusCode });
      } else {
        resolve({ valid: false, status: res.statusCode });
      }
    }).on('error', (err) => {
      resolve({ valid: false, error: err.message });
    });
  });
}

async function audit() {
  const courses = await prisma.course.findMany();
  console.log(`Found ${courses.length} courses in PostgreSQL Database.\n`);

  const deadCourses = [];
  const validCourses = [];

  for (const course of courses) {
    const rawUrl = course.externalUrl || '';
    const match = rawUrl.match(/(?:v=|\/embed\/|\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const videoId = match ? match[1] : null;

    if (!videoId) {
      console.log(`❌ INVALID URL: "${course.title}" -> ${rawUrl}`);
      deadCourses.push({ course, reason: 'No video ID' });
      continue;
    }

    const res = await checkYoutubeVideo(videoId);
    if (res.valid) {
      console.log(`✅ WORKING: "${course.title}" [${videoId}]`);
      validCourses.push({ course, videoId });
    } else {
      console.log(`🔴 DEAD/UNAVAILABLE (${res.status}): "${course.title}" [${videoId}] -> ${rawUrl}`);
      deadCourses.push({ course, videoId, status: res.status });
    }
  }

  console.log(`\n========================================`);
  console.log(`Audit Complete: ${validCourses.length} Valid, ${deadCourses.length} Dead/Unavailable.`);
  console.log(`========================================\n`);

  await prisma.$disconnect();
}

audit().catch(console.error);
