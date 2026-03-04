import { YoutubeTranscript } from 'youtube-transcript';

export async function getTranscript(videoId: string) {
    const langs = ["ja", "en", "en-US", "id"]; // 日本語を最優先に、主要な言語を試行

    for (const lang of langs) {
        try {
            const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
                lang: lang,
            });
            if (transcript && transcript.length > 0) {
                return transcript.map((t) => t.text).join(" ");
            }
        } catch (e) {
            // 指定した言語がなければ次の言語へ
            continue;
        }
    }

    console.warn(`[YouTube] Could not fetch transcript for video: ${videoId} `);
    return null;
}
