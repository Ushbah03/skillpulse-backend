const https = require('https');

const candidates = {
  canva: ['un50Bs4BvZ8', 'dQw4w9WgXcQ', 'k9V2y0R9Lbg', '5b9Z8L1hL6s', 'r1d9b3a0yLg', 'p9b0h0a320k', 'dFgzHOX84xQ'],
  problem_solving: ['8tT4h_R-Y8M', 'r4U9473-b88', 'bMknfKXIFA8', '8JJ101D3knE', '5C_HPTJg5ek']
};

function checkYoutubeVideo(videoId) {
  return new Promise((resolve) => {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    https.get(url, (res) => {
      resolve({ videoId, valid: res.statusCode === 200, status: res.statusCode });
    }).on('error', (err) => {
      resolve({ videoId, valid: false, error: err.message });
    });
  });
}

async function testAll() {
  for (const [cat, ids] of Object.entries(candidates)) {
    console.log(`--- Testing Category: ${cat} ---`);
    for (const id of ids) {
      const res = await checkYoutubeVideo(id);
      console.log(`  [${id}] -> ${res.valid ? '✅ 200 OK' : '🔴 ' + res.status}`);
    }
  }
}

testAll();
