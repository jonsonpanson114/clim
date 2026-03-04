const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const videos = await prisma.video.findMany({
        take: 2,
        orderBy: { publishedAt: 'desc' },
    });

    for (const v of videos) {
        console.log(`--- 動画: ${v.title} ---`);
        console.log(`難易度: ${v.difficultyLevel}`);
        console.log(`要約: ${v.summary}`);
        const data = JSON.parse(v.summaryData);
        console.log(`ポイント: ${data.keyPoints.join(', ')}`);
        console.log(`メニュー: ${data.trainingMenu}`);
        console.log('\n');
    }
}

main().finally(() => prisma.$disconnect());
