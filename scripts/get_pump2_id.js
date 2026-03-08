const { google } = require('googleapis');

async function getPUMP2() {
  const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
  });

  const q = 'PUMP2 クライミングch';
  
  try {
    const res = await youtube.search.list({
      q: q,
      part: ['snippet'],
      type: ['channel'],
      maxResults: 5
    });

    console.log('--- PUMP2 Search Results ---');
    if (res.data.items?.length) {
      res.data.items.forEach(item => {
        console.log(`Title="${item.snippet.title}" ID="${item.snippet.channelId}"`);
      });
    } else {
      console.log(`No results for ${q}`);
    }
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

getPUMP2();
