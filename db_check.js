const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
    const videos = await prisma.video.findMany();
    let output = `Found ${videos.length} videos.\n\n`;

    for (const v of videos) {
        output += `--- Title: ${v.title} ---\n`;
        output += `Summary: ${v.summary}\n`;
        output += `Data: ${v.summaryData}\n\n`;
    }

    fs.writeFileSync('db_check.txt', output);
    console.log('Results written to db_check.txt');
}

main().finally(() => prisma.$disconnect());
