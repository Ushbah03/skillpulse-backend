const http = require('http');

http.get('http://localhost:5000/api/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Health Check Status:', res.statusCode);
    console.log('Response:', data);
  });
}).on('error', console.error);
