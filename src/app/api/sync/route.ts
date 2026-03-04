import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getLatestVideos } from "@/lib/youtube/client";
import { getTranscript } from "@/lib/youtube/transcript";
import { climbingCoachModel } from "@/lib/gemini/client";
import { SUMMARY_PROMPT } from "@/lib/gemini/prompts";

export const dynamic = "force-dynamic";

import fs from 'fs';

export async function GET() {
    const logFile = 'sync_log.txt';
    fs.writeFileSync(logFile, `[Sync] Started at ${new Date().toISOString()}\n`);
    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync(logFile, `${msg}\n`);
    };

    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    log(`[Sync] Channel: ${channelId}`);

    if (!channelId) {
        log(`[Sync] Error: YOUTUBE_CHANNEL_ID not set`);
        return NextResponse.json({ error: "YOUTUBE_CHANNEL_ID is not set" }, { status: 500 });
    }

    try {
        const maxResults = 50;
        const videos = await getLatestVideos(channelId, maxResults);
        log(`[Sync] getLatestVideos returned ${videos.length} videos (max: ${maxResults}).`);
        const results = [];

        for (const video of videos) {
            log(`[Sync] Checking video: ${video.title}`);
            const existing = await prisma.video.findUnique({
                where: { youtubeId: video.youtubeId }
            });

            if (existing) {
                log(`[Sync] Already exists: ${video.youtubeId}`);
                results.push({ id: video.youtubeId, status: "skipped" });
                continue;
            }

            const transcript = await getTranscript(video.youtubeId);
            if (!transcript) {
                log(`[Sync] No transcript found for ${video.youtubeId}. Falling back to Title/Description.`);
            } else {
                log(`[Sync] Transcript obtained (${transcript.length} chars). Calling Gemini...`);
            }

            // 4. Geminiで解析 (字幕がない場合はタイトルと概要欄を重視するよう指示)
            const inputContent = transcript
                ? `[Title]: ${video.title}\n[Description]: ${video.description}\n[Transcript]: ${transcript}`
                : `[Title]: ${video.title}\n[Description]: ${video.description}\n(Note: Transcript is unavailable. Please analyze based on title and description.)`;

            const prompt = SUMMARY_PROMPT(video.title, inputContent);
            const geminiResult = await climbingCoachModel.generateContent(prompt);
            const responseText = geminiResult.response.text();
            log(`[Sync] Gemini response received.`);

            const jsonStr = responseText.replace(/```json\n?|\n?```/g, "").trim();
            let analysis;
            try {
                analysis = JSON.parse(jsonStr);
            } catch (e) {
                log(`[Sync] JSON Parse Error for ${video.youtubeId}. Raw: ${responseText.substring(0, 100)}...`);
                results.push({ id: video.youtubeId, status: "parse_error" });
                continue;
            }

            const upsertedVideo = await prisma.video.upsert({
                where: { youtubeId: video.youtubeId },
                update: {
                    title: video.title,
                    description: video.description || "",
                    thumbnailUrl: video.thumbnailUrl,
                    transcript: transcript || "",
                    summary: analysis.summary,
                    summaryData: JSON.stringify({
                        keyPoints: analysis.keyPoints,
                        moveTechniques: analysis.moveTechniques,
                        trainingMenu: analysis.trainingMenu
                    }),
                    difficultyLevel: analysis.difficulty,
                },
                create: {
                    youtubeId: video.youtubeId,
                    title: video.title,
                    description: video.description || "",
                    thumbnailUrl: video.thumbnailUrl,
                    publishedAt: video.publishedAt,
                    transcript: transcript || "",
                    summary: analysis.summary,
                    summaryData: JSON.stringify({
                        keyPoints: analysis.keyPoints,
                        moveTechniques: analysis.moveTechniques,
                        trainingMenu: analysis.trainingMenu
                    }),
                    difficultyLevel: analysis.difficulty,
                }
            });
            log(`[Sync] Video upserted: ${upsertedVideo.id}`);

            // Tipも既存チェックしてから作成（あるいは件数が少ないので単純作成でも良いが、安全のため）
            await prisma.commonTip.create({
                data: {
                    title: `${video.title}のポイント`,
                    content: analysis.keyPoints.join("\n"),
                    category: analysis.category || "General",
                    difficulty: analysis.difficulty,
                    sourceVideoIds: JSON.stringify([video.youtubeId]),
                }
            });

            results.push({ id: video.youtubeId, status: "synced", dbId: upsertedVideo.id });
        }

        log(`[Sync] Finished. Total synced: ${results.filter(r => r.status === 'synced').length}`);
        return NextResponse.json({ success: true, results });
    } catch (error) {
        log(`[Sync] Fatal error: ${error}`);
        return NextResponse.json({ error: "Failed to sync videos", detail: String(error) }, { status: 500 });
    }
}
