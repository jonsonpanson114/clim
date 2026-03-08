const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const externalVideos = await prisma.video.findMany({
    where: { isExternal: true },
    select: { title: true, isExternal: true }
  });
  
  const officialVideos = await prisma.video.findMany({
    where: { isExternal: false },
    take: 5,
    select: { title: true, isExternal: true }
  });

  console.log('--- External Videos ---');
  console.log(JSON.stringify(externalVideos, null, 2));
  
  console.log('\n--- Official Videos ---');
  console.log(JSON.stringify(officialVideos, null, 2));

  const externalTips = await prisma.commonTip.findMany({
    where: { isExternal: true },
    select: { title: true, isExternal: true }
  });
  
  console.log('\n--- External Tips ---');
  console.log(JSON.stringify(externalTips, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
