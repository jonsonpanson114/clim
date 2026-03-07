import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/db/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateAICoachAdvice(reflection: string, routes: string) {
    if (!process.env.GEMINI_API_KEY) {
        return { advice: "Gemini API key is not configured.", recommendedVideoId: null };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Get all available videos from DB to search for relevance
        const videos = await prisma.video.findMany({
            select: {
                id: true,
                youtubeId: true,
                title: true,
                summary: true
            }
        });

        const videoListText = videos.map(v => `YoutubeID: ${v.youtubeId}, Title: ${v.title}`).join("\n");

        const prompt = `
You are a professional climbing coach. 
A user has just completed a climbing session and provided the following reflection:
"${reflection}"

And their route log:
${routes}

Below is a list of available instructional videos in our database:
${videoListText}

Please provide:
1. Two sentences of encouraging and specific advice (max 100 chars total) in Japanese. 
2. The YoutubeID of the most relevant video from the list above that addresses the user's reflection or problem. If none are very relevant, return null for recommendedVideoId.
3. One concrete goal for their next session.

Respond ONLY in JSON format like this:
{
  "advice": "...",
  "recommendedVideoId": "...",
  "nextGoal": "..."
}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            return data;
        }

        return { advice: "AIがあなたの登りを分析しました。次はさらに高みを目指しましょう！", recommendedVideoId: null, nextGoal: "基礎を大事にしましょう" };
    } catch (error) {
        console.error("AI Coach Error:", error);
        return { advice: "AI分析中にエラーが発生しました。継続こそが力です！", recommendedVideoId: null, nextGoal: "まずは怪我をしないように楽しみましょう" };
    }
}
