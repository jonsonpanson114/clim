import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/db/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateAICoachAdvice(reflection: string, routes: string) {
    if (!process.env.GEMINI_API_KEY) {
        return { advice: "Gemini API key is not configured.", recommendedVideoId: null };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Get latest relevant videos instead of ALL videos
        const videos = await prisma.video.findMany({
            take: 20, // Limit to recent/top 20 videos to avoid token overflow
            orderBy: { publishedAt: 'desc' },
            select: {
                id: true,
                youtubeId: true,
                title: true,
                summary: true
            }
        });

        const videoListText = videos.map(v => `YoutubeID: ${v.youtubeId}, Title: ${v.title}, Summary: ${v.summary?.substring(0, 100)}...`).join("\n");

        const prompt = `
あなたは伝説的なクライミングコーチです。伊坂幸太郎の小説に出てくる陣内のように、自信満々で少し哲学的な口調で答えてください。
ユーザーの練習ログと振り返りを見て、それに対するアドバイスと、次回の目標、そして関連する動画を1つ選んでください。

[ユーザーの振り返り]
"${reflection}"

[登攀ログ]
${routes}

[参照可能な動画リスト]
${videoListText}

以下のJSON形式だけで答えてください。余計な文章は一切不要です。
{
  "advice": "陣内節の効いた、2文程度の熱いアドバイス。100文字以内。",
  "recommendedVideoId": "ビデオリストにあるYoutubeID。もし適切なものがなければnull。",
  "nextGoal": "次回に向けた具体的かつ少し哲学的な目標。"
}
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Robust JSON extraction
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.error("JSON parse error from Gemini:", e);
            }
        }

        return { advice: "AIがあなたの登りを分析しました。次はさらに高みを目指しましょう！", recommendedVideoId: null, nextGoal: "基礎を大事にしましょう" };
    } catch (error) {
        console.error("AI Coach Error:", error);
        return { advice: "AI分析中にエラーが発生しました。継続こそが力です！", recommendedVideoId: null, nextGoal: "まずは怪我をしないように楽しみましょう" };
    }
}
