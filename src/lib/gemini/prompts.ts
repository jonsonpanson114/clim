export const SUMMARY_PROMPT = (title: string, transcript: string) => `
動画タイトル: "${title}"
字幕データ: """
${transcript}
"""

上記のクライミング解説動画の字幕を解析し、以下の情報をJSON形式で抽出してください。
出力は日本語で行い、プロのクライミングコーチとしての視点を忘れないでください。

JSONフォーマット:
{
  "summary": "動画の全体的な要約（300文字程度）",
  "difficulty": "初級, 中級, 上級 のいずれか",
  "category": "ムーブ, トレーニング, メンタル, 道具 のいずれか",
  "keyPoints": ["重要なコツ1", "重要なコツ2", "重要なコツ3"],
  "moveTechniques": ["使用されている具体的なムーブ名（例：ヒールフック、ダイノ等）"],
  "trainingMenu": "この動画の内容を実践するための具体的な練習TODOリスト"
}
`;

export const QA_PROMPT = (question: string, context: string) => `
クライミングに関する質問: "${question}"
参考情報（関連動画の要約）: """
${context}
"""

提供された参考情報を元に、プロのクライミングコーチとして質問に回答してください。
回答はJSON形式で行ってください。

JSONフォーマット:
{
  "answer": "コーチとしてのアドバイス回答",
  "reasoning": "なぜそのアドバイスをするのかの理由",
  "caution": "実践する際の注意点や怪我の予防"
}
`;
