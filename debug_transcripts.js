const { YoutubeTranscript } = require('youtube-transcript');

async function debug(videoId) {
    console.log(`Checking: ${videoId}`);
    try {
        const list = await YoutubeTranscript.listTranscripts(videoId);
        console.log('Available transcripts:', list.map(t => `${t.languageCode} (${t.kind})`));

        const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'ja' });
        console.log(`Success! Length: ${transcript.length}`);
    } catch (e) {
        console.error(`Error for ${videoId}:`, e.message);
    }
}

// 先ほど失敗したビデオたち
const ids = ['ioaKIIbwN5U', 'owIK10o7hcI', 'Of2WhZHa0sQ'];

async function run() {
    for (const id of ids) {
        await debug(id);
        console.log('---');
    }
}

run();
