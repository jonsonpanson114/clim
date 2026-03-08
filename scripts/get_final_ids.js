const { google } = require('googleapis');

async function getIds() {
  const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
  });

  const queries = [
    { name: 'TAMY Climbing Channel', q: '@tamyclimbingchannel800' },
    { name: 'JMSCA Competition TV', q: '@JMACompetitionTV' },
    { name: 'Miho Nonaka', q: '@Miho_Nonaka' },
    { name: 'PUMP2 Climbing', q: '@PUMP2%E3%82%AF%E3%83%A9%E3%82%A4%E3%83%9F%E3%83%B3%E3%82%B0ch' },
    { name: 'Lattice Training', q: '@LatticeTraining' },
    { name: 'Magnus Midtbø', q: '@magmidt' },
    { name: 'Movement for Climbers', q: '@MovementforClimbers' }
  ];

  console.log('--- Final ID Verification ---');
  for (const query of queries) {
    try {
      const res = await youtube.search.list({
        q: query.q,
        part: ['snippet'],
        type: ['channel'],
        maxResults: 1
      });

      if (res.data.items?.length) {
        const item = res.data.items[0];
        console.log(`${query.name} [${query.q}]: ID="${item.snippet.channelId}" Title="${item.snippet.title}"`);
      } else {
        console.log(`${query.name} [${query.q}]: NOT FOUND`);
      }
    } catch (e) {
      console.log(`Error checking ${query.name}: ${e.message}`);
    }
  }
}

getIds();
