import { prisma } from "@/lib/db/prisma";
import { climbingCoachModel } from "@/lib/gemini/client";

export async function generateAICoachAdvice(reflection: string, routes: string) {
    console.log("[AI Coach] --- START Advice Generation (QA Logic Sync) ---");
    
    try {
        const model = climbingCoachModel;

        // 1. Get latest relevant videos - EXACTLY LIKE QA PAGE
        console.log("[AI Coach] Fetching video context...");
        const relevantVideos = await prisma.video.findMany({
            take: 10,
            orderBy: { publishedAt: "desc" },
            select: { title: true, summary: true, youtubeId: true, difficultyLevel: true, isExternal: true }
        });
        console.log("[AI Coach] Found video context:", relevantVideos.length);

        const context = relevantVideos
            .map(v => `動画ID: ${v.youtubeId}\nタイトル: ${v.title}\nソース: ${v.isExternal ? "外部の世界知識" : "公式解説"}\nコーチの分析: ${v.summary}`)
            .join("\n\n");

        // 2. Format routes for readability
        let displayRoutes = routes;
        try {
            const parsed = JSON.parse(routes);
            displayRoutes = Array.isArray(parsed) ? parsed.join("\n") : String(routes);
        } catch (e) { }

        // 3. Construct Prompt - Mirroring the tone of Jinnai
        const prompt = `
あなたは伝説的なクライミングコーチの陣内です。自信満々で少し哲学的な口調で答えてください。
ユーザーの練習ログと振り返りを分析し、それに対する「熱いアドバイス」「次回の具体的目標」「関連動画(動画ID)」を1つ選んでください。

[ユーザーの振り返り]
"${reflection}"

[登攀ログ]
${displayRoutes}

[参照可能なコーチの解説（参考動画リスト）]
${context}

必ず以下のJSON形式でのみ返答してください。
{
  "advice": "陣内節のアドバイス(100文字程度)",
  "nextGoal": "具体的な次回の課題(50文字以内)",
  "recommendedVideoId": "リスト内の動画ID。適切なものがなければnull。"
}
`;

        // 4. Generate Content
        console.log("[AI Coach] Requesting Gemini output...");
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        
        // 5. Robust Extraction
        let analysis;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : text;
        try {
            analysis = JSON.parse(jsonStr);
        } catch (e) {
            console.error("[AI Coach] Final JSON parse fail:", text);
        }

        return {
            advice: analysis?.advice || "お前の登り、悪くないぜ。ホールドの隙間に潜む真実をもっと探ってみろ。",
            nextGoal: analysis?.nextGoal || "今日はゆっくり休んで、明日また指先を鍛えろ。",
            recommendedVideoId: analysis?.recommendedVideoId || (relevantVideos.length > 0 ? relevantVideos[0].youtubeId : null)
        };

    } catch (error: any) {
        console.error("[AI Coach] CRITICAL FAILURE:", error.message);
        return { 
            advice: `陣内だ。少し思考の迷路に入っちまったようだ。だがお前の努力は無駄じゃない。エラー: ${error.message.substring(0, 20)}`, 
            nextGoal: "まずは自分の重心を再確認しろ。", 
            recommendedVideoId: null 
        };
    }
}
