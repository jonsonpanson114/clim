import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/db/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateAICoachAdvice(reflection: string, routes: string) {
    console.log("[AI Coach] --- START Advice Generation ---");
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("[AI Coach] API Key configured:", !!apiKey);
    
    if (!apiKey) {
        console.error("[AI Coach] Error: GEMINI_API_KEY is missing!");
        return { advice: "AIキーが設定されていません。", recommendedVideoId: null, nextGoal: "管理画面でAPIキーを確認してください。" };
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 1. Get latest relevant videos - with error boundary
        let videos: any[] = [];
        try {
            console.log("[AI Coach] Fetching videos from DB...");
            videos = await prisma.video.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' }, // Use createdAt as fallback if publishedAt is risky
                select: { id: true, youtubeId: true, title: true, summary: true }
            });
            console.log("[AI Coach] Found videos:", videos.length);
        } catch (dbErr: any) {
            console.error("[AI Coach] DB Video Fetch Error:", dbErr.message);
            // We continue even without videos
        }

        const videoListText = videos.length > 0 
            ? videos.map(v => `- [${v.youtubeId}] ${v.title}`).join("\n")
            : "参照可能なビデオはありません。";

        // 2. Format routes
        let displayRoutes = routes;
        try {
            const parsed = JSON.parse(routes);
            displayRoutes = Array.isArray(parsed) ? parsed.join("\n") : String(routes);
        } catch (e) {
            console.log("[AI Coach] Routes parsing failed, using raw string");
        }

        const prompt = `
あなたは伝説的なクライミングコーチの陣内です。自信満々で哲学的な口調で答えてください。
ユーザーの練習ログと振り返りを見て、アドバイス、次回の具体的目標、推奨動画(YoutubeID)を選んでください。

[振り返り]
"${reflection}"

[ログ]
${displayRoutes}

[推薦可能ビデオ]
${videoListText}

必ず以下のJSON形式でのみ返答してください。
{
  "advice": "熱い陣内節のアドバイス(100文字程度)",
  "nextGoal": "具体的な次回の課題(50文字以内)",
  "recommendedVideoId": "リスト内のYoutubeID、または適したものがなければnull"
}
`;

        // 3. Generate Content - with timing
        console.log("[AI Coach] Calling Gemini API...");
        const startTime = Date.now();
        const result = await model.generateContent(prompt);
        console.log(`[AI Coach] Gemini responded in ${Date.now() - startTime}ms`);

        const text = result.response.text().trim();
        console.log("[AI Coach] Raw text received:", text.substring(0, 50) + "...");

        // 4. Extract JSON
        let analysis;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                analysis = JSON.parse(jsonMatch[0]);
                console.log("[AI Coach] JSON parsed successfully");
            } catch (e) {
                console.error("[AI Coach] JSON parsing failed!");
            }
        }

        return {
            advice: analysis?.advice || "お前の登り、悪くないぜ。ホールドの隙間に潜む真実をもっと探ってみろ。",
            nextGoal: analysis?.nextGoal || "今日はゆっくり休んで、明日また指先を鍛えろ。",
            recommendedVideoId: analysis?.recommendedVideoId || (videos.length > 0 ? videos[0].youtubeId : null)
        };

    } catch (error: any) {
        console.error("[AI Coach] FATAL ERROR:", error.message);
        return { 
            advice: `陣内だ。少し思考の迷路に入っちまったようだ。エラー内容: ${error.message.substring(0, 30)}`, 
            nextGoal: "まずは自分の重心を再確認しろ。", 
            recommendedVideoId: null 
        };
    }
}
