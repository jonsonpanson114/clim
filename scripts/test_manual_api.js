const fetch = require('node-fetch');

async function test() {
  const videoId = '7r0M4-dY3Gg'; // IFSC Women's Boulder Final
  console.log(`Testing manual sync for ${videoId}...`);
  
  const res = await fetch('http://localhost:3000/api/sync/manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId })
  });
  
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

test().catch(console.error);
