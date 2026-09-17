const https = require('https');

const list27 = [
  { title: "React 19 & Next.js 15 Full Stack Architecture", id: "bMknfKXIFA8" },
  { title: "Python Microservices with FastAPI & Docker", id: "t8pPdKYpowI" },
  { title: "Figma UI/UX Design Masterclass", id: "c9Wg6Cb_YlU" },
  { title: "TypeScript 5 Advanced Design Patterns", id: "d56mG7DezGs" },
  { title: "Kubernetes Cluster Security & Hardening", id: "d6WC5n9G_sM" },
  { title: "Node.js & Express Enterprise Backend Mastery", id: "Oe421EPjeBE" },
  { title: "PostgreSQL & Database Performance Tuning", id: "qw--VYLpxG4" },
  { title: "Docker & Containerization Fundamentals", id: "fqMOX6JJhGo" },
  { title: "AWS Cloud Practitioner & Architecture", id: "k1RI5locZE4" },
  { title: "Vue.js 3 & Pinia Modern Frontend Development", id: "FXpIoQ_rT_c" },
  { title: "Flutter & Dart Cross-Platform Mobile Apps", id: "VPvVD8t02U8" },
  { title: "GraphQL & Apollo Server API Design", id: "ed8SzALpx1Q" },
  { title: "Git, GitHub & Enterprise DevOps CI/CD", id: "8JJ101D3knE" },
  { title: "Cybersecurity & Ethical Hacking Essentials", id: "3Kq1MIfTWCE" },
  { title: "Tailwind CSS & Modern Responsive Web Design", id: "dFgzHOX84xQ" },
  { title: "Rust Programming Language & Systems Engineering", id: "5C_HPTJg5ek" },
  { title: "Spring Boot 3 & Java Microservices", id: "35EQXmHKZYs" },
  { title: "Data Science & Machine Learning with Python", id: "LHBE6Q9XlzI" },
  { title: "Prompt Engineering & Generative AI Applications", id: "jC4v5AS4RIM" },
  { title: "Agile Scrum Master & Product Management", id: "9TycLR0TqFA" },
  { title: "Angular 18 Enterprise Web Applications", id: "Ata9cSC2WpM" },
  { title: "Redis Caching & In-Memory Data Structures", id: "G1rOthIU-uo" },
  { title: "Linux Systems Administration & Bash Scripting", id: "wBp0Rb-ZJak" },
  { title: "MongoDB & NoSQL Database Engineering", id: "c2M-rlkkT5o" },
  { title: "Canva Graphic & Presentation Design", id: "c9Wg6Cb_YlU" },
  { title: "Problem Solving & Critical Thinking", id: "9TycLR0TqFA" },
  { title: "UI/UX Research & Design Thinking Fundamentals", id: "jwCmIBJ8Jtc" }
];

function checkYoutubeVideo(videoId) {
  return new Promise((resolve) => {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    https.get(url, (res) => {
      resolve({ valid: res.statusCode === 200, status: res.statusCode });
    }).on('error', (err) => {
      resolve({ valid: false, error: err.message });
    });
  });
}

async function verify27() {
  console.log(`Verifying ${list27.length} courses...`);
  let passCount = 0;
  for (const item of list27) {
    const res = await checkYoutubeVideo(item.id);
    if (res.valid) {
      console.log(`✅ [${item.id}] ${item.title}`);
      passCount++;
    } else {
      console.log(`🔴 FAIL (${res.status}) [${item.id}] ${item.title}`);
    }
  }
  console.log(`Result: ${passCount} / ${list27.length} passed.`);
}

verify27();
