require('dotenv').config({ path: '.env.production.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function copyFromSqliteToPostgres() {
    console.log("Connecting to Postgres:", process.env.DATABASE_URL.substring(0, 30) + '...');

    // SQLite can be read using another prisma client or just sqlite3
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('./dev.db', sqlite3.OPEN_READONLY);

    db.all("SELECT * FROM Video", async (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(`Found ${rows.length} videos in dev.db`);
        let copied = 0;
        for (const row of rows) {
            try {
                // Ensure date fields are properly formatted for JS Date
                const videoData = {
                    youtubeId: row.youtubeId,
                    title: row.title,
                    description: row.description || '',
                    thumbnailUrl: row.thumbnailUrl || '',
                    publishedAt: new Date(row.publishedAt),
                    transcript: row.transcript || '',
                    summary: row.summary || '',
                    summaryData: row.summaryData || '',
                    difficultyLevel: row.difficultyLevel || ''
                };

                await prisma.video.upsert({
                    where: { youtubeId: row.youtubeId },
                    update: videoData,
                    create: videoData
                });
                copied++;
            } catch (upsertErr) {
                console.error(`Error upserting video ${row.youtubeId}:`, upsertErr.message);
            }
        }
        console.log(`Successfully copied ${copied} videos to Postgres.`);

        // Also copy common tips
        db.all("SELECT * FROM CommonTip", async (err, tips) => {
            if (err) return;
            let countTips = 0;
            for (const tip of tips) {
                try {
                    await prisma.commonTip.upsert({
                        where: { id: tip.id },
                        update: {
                            lessonId: tip.lessonId,
                            title: tip.title,
                            content: tip.content,
                            category: tip.category,
                            difficulty: tip.difficulty,
                            tags: tip.tags
                        },
                        create: {
                            id: tip.id,
                            lessonId: tip.lessonId,
                            title: tip.title,
                            content: tip.content,
                            category: tip.category,
                            difficulty: tip.difficulty,
                            tags: tip.tags
                        }
                    });
                    countTips++;
                } catch (e) { }
            }
            console.log(`Successfully copied ${countTips} tips to Postgres.`);
            process.exit(0);
        });
    });
}

copyFromSqliteToPostgres();
