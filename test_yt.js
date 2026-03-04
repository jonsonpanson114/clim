const { google } = require('googleapis');
require('dotenv').config();

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY,
});

async function test() {
    const handle = process.env.YOUTUBE_CHANNEL_ID;
    console.log(`Testing handle: ${handle}`);

    try {
        const res = await youtube.channels.list({
            part: ['id', 'snippet'],
            forHandle: handle,
        });

        if (res.data.items && res.data.items.length > 0) {
            const channelId = res.data.items[0].id;
            console.log(`Success! Channel ID: ${channelId}`);

            const searchRes = await youtube.search.list({
                channelId: channelId,
                part: ['snippet'],
                order: 'date',
                maxResults: 3,
                type: ['video'],
            });

            console.log(`Found ${searchRes.data.items.length} videos.`);
            searchRes.data.items.forEach(v => console.log(`- ${v.snippet.title}`));
        } else {
            console.log('No channel found for this handle.');
        }
    } catch (err) {
        console.error('API Error:', err.message);
    }
}

test();
