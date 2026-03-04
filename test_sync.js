const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const { google } = require('googleapis');
const { YoutubeTranscript } = require('youtube-transcript');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();
const youtube = google.youtube({ version: 'v3', auth: process.env.YOUTUBE_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }); // 元々の設定に合わせて

async function run() {
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    console.log(`Target: ${channelId}`);

    const searchRes = await youtube.search.list({
        channelId: channelId,
        part: ['snippet'],
        order: 'date',
        maxResults: 1,
        type: ['video'],
    });

    const video = searchRes.data.items[0];
    if (!video) {
        console.log('No video found.');
        return;
    }

    console.log(`Found: ${video.snippet.title}`);
    const videoId = video.id.videoId;

    const transcript = await YoutubeTranscript.fetchTranscript(videoId).catch(e => null);
    if (!transcript) {
        console.log('No transcript.');
        return;
    }
    console.log(`Transcript found: ${transcript.length} items`);

    const prompt = `以下のクライミング動画の内容を解析しろ：\nタイトル: ${video.snippet.title}\n字幕: ${transcript.map(t => t.text).join(' ')}\n\n出力形式: JSON { "summary": String, "keyPoints": String[], "difficulty": String, "trainingMenu": String, "category": String }`;
    const result = await model.generateContent(prompt);
    console.log('Gemini responded.');
    console.log(result.response.text());
}

run().catch(console.error).finally(() => prisma.$disconnect());
