import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey && process.env.NODE_ENV === 'production') {
    throw new Error("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(apiKey || "dummy_key");

// ユーザーの要望に基づき Gemini 3 Flash を指定
export const climbingCoachModel = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
    },
    systemInstruction: "あなたは15年の経験を持つプロのクライミングコーチです。YouTube動画の字幕を解析し、具体的で実践的なアドバイスを提供します。回答は常に指定されたJSON形式で行ってください。",
});
