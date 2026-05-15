import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const roles = await prisma.role.findMany();
  console.log(JSON.stringify(roles, null, 2));
  await prisma.$disconnect();
}

main();
