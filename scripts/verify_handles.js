const { google } = require('googleapis');

async function verify() {
  const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
  });

  const handles = [
    '@TAMYClimbingChannel',
    '@TAMYCHANNEL',
    '@goodmorningclimbing',
    '@kataraguchiclimbing',
    '@JMACompetitionTV',
    '@teamau_climbing'
  ];

  console.log('--- Verifying Handles ---');
  for (const handle of handles) {
    try {
      // Use search for handle-like queries or list if exact ID
      // Actually, for @handles, we can use search on 'forHandle' is not available in v3 directly for @ handles
      // But we can search for the handle string
      const res = await youtube.search.list({
        q: handle,
        part: ['snippet'],
        type: ['channel'],
        maxResults: 1
      });

      if (res.data.items?.length) {
        const item = res.data.items[0];
        console.log(`Matched [${handle}]: Title="${item.snippet.title}" ChannelId="${item.snippet.channelId}"`);
      } else {
        console.log(`No match for [${handle}]`);
      }
    } catch (e) {
      console.log(`Error checking [${handle}]: ${e.message}`);
    }
  }
}

verify();
