const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const total = await prisma.video.count();
  const external = await prisma.video.count({ where: { isExternal: true } });
  const tips = await prisma.commonTip.count();
  
  console.log(`Total videos: ${total}`);
  console.log(`External videos: ${external}`);
  console.log(`Total tips: ${tips}`);
}

check().catch(console.error).finally(() => prisma.$disconnect());
