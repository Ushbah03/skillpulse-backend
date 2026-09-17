const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const verifiedMapping = [
  { titleMatch: 'Figma UI/UX Design Masterclass', embed: 'https://www.youtube.com/embed/c9Wg6Cb_YlU' },
  { titleMatch: 'Canva Graphic & Presentation Design', embed: 'https://www.youtube.com/embed/c9Wg6Cb_YlU' },
  { titleMatch: 'Problem Solving & Critical Thinking', embed: 'https://www.youtube.com/embed/9TycLR0TqFA' },
  { titleMatch: 'React 19 & Next.js 15 Full Stack Architecture', embed: 'https://www.youtube.com/embed/bMknfKXIFA8' },
  { titleMatch: 'Python Microservices with FastAPI & Docker', embed: 'https://www.youtube.com/embed/t8pPdKYpowI' },
  { titleMatch: 'Kubernetes Cluster Security & Hardening', embed: 'https://www.youtube.com/embed/d6WC5n9G_sM' },
  { titleMatch: 'Node.js & Express Enterprise Backend Mastery', embed: 'https://www.youtube.com/embed/Oe421EPjeBE' },
  { titleMatch: 'TypeScript 5 Advanced Design Patterns', embed: 'https://www.youtube.com/embed/d56mG7DezGs' },
  { titleMatch: 'Tailwind CSS & Modern Responsive Web Design', embed: 'https://www.youtube.com/embed/dFgzHOX84xQ' },
  { titleMatch: 'PostgreSQL & Database Performance Tuning', embed: 'https://www.youtube.com/embed/qw--VYLpxG4' },
  { titleMatch: 'Docker & Containerization Fundamentals', embed: 'https://www.youtube.com/embed/fqMOX6JJhGo' },
  { titleMatch: 'AWS Cloud Practitioner & Architecture', embed: 'https://www.youtube.com/embed/k1RI5locZE4' },
  { titleMatch: 'Vue.js 3 & Pinia Modern Frontend Development', embed: 'https://www.youtube.com/embed/FXpIoQ_rT_c' },
  { titleMatch: 'Flutter & Dart Cross-Platform Mobile Apps', embed: 'https://www.youtube.com/embed/VPvVD8t02U8' },
  { titleMatch: 'GraphQL & Apollo Server API Design', embed: 'https://www.youtube.com/embed/ed8SzALpx1Q' },
  { titleMatch: 'Git, GitHub & Enterprise DevOps CI/CD', embed: 'https://www.youtube.com/embed/8JJ101D3knE' },
  { titleMatch: 'Cybersecurity & Ethical Hacking Essentials', embed: 'https://www.youtube.com/embed/3Kq1MIfTWCE' },
  { titleMatch: 'Data Science & Machine Learning with Python', embed: 'https://www.youtube.com/embed/LHBE6Q9XlzI' },
  { titleMatch: 'Prompt Engineering & Generative AI Applications', embed: 'https://www.youtube.com/embed/jC4v5AS4RIM' },
  { titleMatch: 'Agile Scrum Master & Product Management', embed: 'https://www.youtube.com/embed/9TycLR0TqFA' },
  { titleMatch: 'Angular 18 Enterprise Web Applications', embed: 'https://www.youtube.com/embed/Ata9cSC2WpM' },
  { titleMatch: 'Rust Programming Language & Systems Engineering', embed: 'https://www.youtube.com/embed/5C_HPTJg5ek' },
  { titleMatch: 'Spring Boot 3 & Java Microservices', embed: 'https://www.youtube.com/embed/35EQXmHKZYs' },
  { titleMatch: 'Redis Caching & In-Memory Data Structures', embed: 'https://www.youtube.com/embed/G1rOthIU-uo' },
  { titleMatch: 'Linux Systems Administration & Bash Scripting', embed: 'https://www.youtube.com/embed/wBp0Rb-ZJak' },
  { titleMatch: 'MongoDB & NoSQL Database Engineering', embed: 'https://www.youtube.com/embed/c2M-rlkkT5o' },
  { titleMatch: 'UI/UX Research & Design Thinking Fundamentals', embed: 'https://www.youtube.com/embed/jwCmIBJ8Jtc' }
];

async function updateDB() {
  console.log('Updating PostgreSQL Database with 27 verified YouTube URLs...\n');
  let updated = 0;

  for (const item of verifiedMapping) {
    const res = await prisma.course.updateMany({
      where: {
        title: { contains: item.titleMatch, mode: 'insensitive' }
      },
      data: {
        externalUrl: item.embed,
        provider: 'YouTube Educational LMS'
      }
    });
    console.log(`Updated "${item.titleMatch}": ${res.count} rows -> ${item.embed}`);
    updated += res.count;
  }

  console.log(`\nDone! Updated ${updated} course entries in PostgreSQL DB.`);
  await prisma.$disconnect();
}

updateDB().catch(console.error);
