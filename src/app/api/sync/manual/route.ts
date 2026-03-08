import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { YoutubeTranscript } from 'youtube-transcript';
import { SUMMARY_PROMPT } from '@/lib/gemini/prompts';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { videoId } = await req.json();

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // Check if already exists
    const existing = await prisma.video.findUnique({ where: { youtubeId: videoId } });
    if (existing) {
      return NextResponse.json({ message: 'Video already analyzed', video: existing });
    }

    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });

    // 1. Fetch Metadata
    const videoRes = await youtube.videos.list({
      id: [videoId],
      part: ['snippet', 'statistics']
    });

    if (!videoRes.data.items?.length) {
      return NextResponse.json({ error: 'Video not found on YouTube' }, { status: 404 });
    }

    const item = videoRes.data.items[0];
    const title = item.snippet?.title || '';
    const description = item.snippet?.description || '';
    const thumbnailUrl = item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url;
    const publishedAt = item.snippet?.publishedAt ? new Date(item.snippet.publishedAt) : new Date();

    // 2. Fetch Transcript
    let transcriptText = "";
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      transcriptText = transcript.map(t => t.text).join(" ");
    } catch (e) {
      console.error('Transcript fetch failed', e);
    }

    // 3. AI Analysis
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }, { apiVersion: 'v1beta' });

    const prompt = SUMMARY_PROMPT(title, transcriptText || description);
    const res = await model.generateContent(prompt);
    const responseText = (await res.response).text();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI output lacks JSON");
    const analysis = JSON.parse(jsonMatch[0]);

    // 4. Save to DB
    const video = await prisma.video.create({
      data: {
        youtubeId: videoId,
        title,
        description,
        thumbnailUrl,
        publishedAt,
        transcript: transcriptText,
        summary: analysis.summary,
        difficultyLevel: analysis.difficulty,
        isExternal: true, // Mark as external
        summaryData: JSON.stringify({
          keyPoints: analysis.keyPoints,
          trainingMenu: analysis.trainingMenu
        })
      }
    });

    // 5. Create Tip
    await prisma.commonTip.create({
      data: {
        title: `${title}のコツ`,
        content: analysis.keyPoints.join("\n"),
        category: analysis.category || "ムーブ",
        difficulty: analysis.difficulty,
        isExternal: true, // Mark as external
        sourceVideoIds: JSON.stringify([videoId])
      }
    });


    return NextResponse.json({ message: 'Success', video });

  } catch (error: any) {
    console.error('Manual sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
