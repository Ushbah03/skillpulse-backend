const https = require('https');

const candidates = {
  figma: ['c9Wg6Cb_YlU', 'jwCmIBJ8Jtc', 'FTFaQWZBqQ8', 'cA74eAup_D8'],
  canva: ['6p4y4zX1LgY', 'z48n0_l2N68', 'P9b0h0a320k', '0c3_1W1d2t8'],
  nodejs: ['Oe421EPjeBE', 'fBNz5xF-Kx4', 'LAUi8pOIc68', 'TlB_eWDSMt4'],
  problem_solving: ['vLnPpxj078U', 'QjM66gS1n2A', 'UBVV8pcm14M'],
  cybersecurity: ['3Kq1MIfTWCE', 'qwA6Mm055XQ', 'U_P23uqU4CA'],
  datascience: ['ua-CiDNNj3U', 'LHBE6Q9XlzI', 'aircAruvnKk']
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
