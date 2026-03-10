import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/db/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateAICoachAdvice(reflection: string, routes: string) {
    console.log("[AI Coach] Advice generation requested");
    console.log("[AI Coach] GEMINI_API_KEY presence:", !!process.env.GEMINI_API_KEY);
    
    if (!process.env.GEMINI_API_KEY) {
        console.error("[AI Coach] Missing GEMINI_API_KEY!");
        return { advice: "AIキーが設定されていません。管理者に連絡してください。", recommendedVideoId: null, nextGoal: "APIキーを設定しましょう" };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Format routes for AI - convert ["3級：3/5"] to "3級：3/5"
        let displayRoutes = routes;
        try {
            const parsed = JSON.parse(routes);
            if (Array.isArray(parsed)) {
                displayRoutes = parsed.join("\n");
            }
        } catch (e) {
            // Keep as is if not parseable
        }

        // Get latest relevant videos
        const videos = await prisma.video.findMany({
            take: 10,
            orderBy: { publishedAt: 'desc' },
            select: { id: true, youtubeId: true, title: true, summary: true }
        });

        const videoListText = videos.map(v => `- [${v.youtubeId}] ${v.title}`).join("\n");

        const prompt = `
あなたは伝説的なクライミングコーチの陣内です。自信満々で哲学的な口調で答えてください。
ユーザーの練習ログと振り返りを見て、それに対するアドバイス、次回の目標、そして関連動画（YoutubeID）を1つ選んでください。

[ユーザーの振り返り]
"${reflection}"

[登攀ログ]
${displayRoutes}

[推薦可能ビデオ]
${videoListText}

必ず以下のJSON形式でのみ返答してください。
{
  "advice": "熱い陣内節のアドバイス(100文字以内)",
  "nextGoal": "具体的な次回の課題",
  "recommendedVideoId": "リスト内のYoutubeID、またはnull"
}
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        console.log("[AI Coach] Raw Response:", text);

        // More robust JSON extraction
        let analysis;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            try {
                analysis = JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.error("[AI Coach] JSON parse error:", e);
            }
        }

        // If something went wrong, provide a solid fallback that doesn't feel like an error
        return {
            advice: analysis?.advice || "お前の登り、悪くないぜ。だがまだ壁を『見て』ないな。次はもっとホールドの囁きを聞いてみろ。",
            nextGoal: analysis?.nextGoal || "今日はゆっくり休んで、明日また壁の前に立て。",
            recommendedVideoId: analysis?.recommendedVideoId || (videos.length > 0 ? videos[0].youtubeId : null)
        };
    } catch (error) {
        console.error("AI Coach External Error:", error);
        return { 
            advice: "済まない、少し思考のホールドを外した。だがお前の努力は無駄じゃない。次も登り続けろ。", 
            nextGoal: "まずは自分の指を信じることだ。", 
            recommendedVideoId: null 
        };
    }
}
