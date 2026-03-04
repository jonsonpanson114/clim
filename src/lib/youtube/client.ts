import { google } from "googleapis";

const youtube = google.youtube({
    version: "v3",
    auth: process.env.YOUTUBE_API_KEY,
});

export async function getChannelIdByHandle(handle: string) {
    console.log(`[YouTube] Resolving handle: ${handle}`);
    try {
        const cleanHandle = handle.startsWith("@") ? handle : `@${handle}`;
        const response = await youtube.channels.list({
            part: ["id"],
            forHandle: cleanHandle,
        });
        const id = response.data.items?.[0]?.id || null;
        console.log(`[YouTube] Resolved handle ${cleanHandle} to ID: ${id}`);
        return id;
    } catch (error) {
        console.error("[YouTube] Error resolving handle:", error);
        return null;
    }
}

export async function getLatestVideos(channelIdOrHandle: string, maxResults = 10) {
    try {
        let channelId = channelIdOrHandle;

        // ハンドル名（@）の場合は実際のChannel IDに解決する
        if (channelIdOrHandle.startsWith("@")) {
            const resolvedId = await getChannelIdByHandle(channelIdOrHandle);
            if (!resolvedId) {
                console.error("Could not resolve handle:", channelIdOrHandle);
                return [];
            }
            channelId = resolvedId;
        }

        const response = await youtube.search.list({
            channelId: channelId,
            part: ["snippet"],
            order: "date",
            maxResults: maxResults,
            type: ["video"],
            // videoDuration の制限を削除し、Shortsも取得対象にする
        });

        return response.data.items?.map((item) => ({
            youtubeId: item.id?.videoId as string,
            title: item.snippet?.title as string,
            description: item.snippet?.description as string,
            thumbnailUrl: item.snippet?.thumbnails?.high?.url as string,
            publishedAt: new Date(item.snippet?.publishedAt as string),
        })) || [];
    } catch (error) {
        console.error("Error fetching YouTube videos:", error);
        return [];
    }
}

export async function getVideoDetails(videoId: string) {
    try {
        const response = await youtube.videos.list({
            id: [videoId],
            part: ["snippet", "contentDetails"],
        });

        const item = response.data.items?.[0];
        if (!item) return null;

        return {
            youtubeId: videoId,
            title: item.snippet?.title as string,
            description: item.snippet?.description as string,
            thumbnailUrl: item.snippet?.thumbnails?.high?.url as string,
            publishedAt: new Date(item.snippet?.publishedAt as string),
        };
    } catch (error) {
        console.error("Error fetching YouTube video details:", error);
        return null;
    }
}
