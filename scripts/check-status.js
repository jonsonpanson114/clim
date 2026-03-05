const { PrismaClient } = require('@prisma/client');
const path = require('path');
const dbPath = path.resolve(__dirname, '../prisma/dev.db');
process.env.DATABASE_URL = `file:${dbPath}`;

const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Content Check ---');
    const videos = await prisma.video.findMany({
        where: {
            OR: [
                { title: { contains: '振られ' } },
                { title: { contains: 'フララ' } },
                { title: { contains: 'スローパー' } }
            ]
        },
        orderBy: { publishedAt: 'desc' }
    });

    if (videos.length === 0) {
        console.log('No matching videos found in DB.');
    } else {
        videos.forEach(v => {
            console.log(`[${v.publishedAt}] ${v.title}`);
            console.log(`   Analyzed: ${v.summary ? '✅ YES' : '❌ NO'}`);
            if (v.summary) {
                console.log(`   Summary snippet: ${v.summary.substring(0, 50)}...`);
            }
            console.log('---');
        });
    }

    const total = await prisma.video.count();
    const analyzedCount = await prisma.video.count({ where: { summary: { not: null } } });
    console.log(`Total videos in DB: ${total}`);
    console.log(`Total analyzed: ${analyzedCount}`);

    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
