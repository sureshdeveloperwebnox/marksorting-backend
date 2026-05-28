require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Mock ActivityLogsService.findAll and exportToExcel
const service = {
  prisma,
  async findAll(dto) {
    const { skip, take, user_id, action, entity_type, entity_id, start_date, end_date, search } = dto;
    console.log("findAll received dto:", { skip, take, user_id, action, entity_type, entity_id, start_date, end_date, search });

    const where = {};

    if (user_id) {
      where.user_id = user_id;
    }

    if (action) {
      where.action = action;
    }

    if (entity_type) {
      where.entity_type = entity_type;
    }

    if (entity_id) {
      where.entity_id = entity_id;
    }

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) {
        where.created_at.gte = new Date(start_date);
      }
      if (end_date) {
        where.created_at.lte = new Date(end_date);
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { entity_type: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        skip: skip || 0,
        take: take || 25,
      },
    };
  },

  async exportToExcel(dto) {
    console.log("exportToExcel received dto:", dto);
    const { skip, take, ...filterDto } = dto;
    console.log("exportToExcel destructuring:", { skip, take, filterDto });

    const allLogs = await this.findAll({ ...filterDto, skip: 0, take: 10000 });
    console.log("allLogs.data count:", allLogs.data.length);
    return allLogs.data;
  }
};

async function main() {
  await prisma.$connect();
  console.log("Connected");

  // Case 1: dto is empty (standard request without transform)
  console.log("\n--- TEST CASE 1: Empty dto ---");
  await service.exportToExcel({});

  // Case 2: dto with NestJS validation/transform defaults
  console.log("\n--- TEST CASE 2: dto with Class Defaults ---");
  await service.exportToExcel({ skip: 0, take: 25 });

  // Case 3: dto with start_date and end_date as undefined strings (e.g. from query params parse)
  console.log("\n--- TEST CASE 3: dto with undefined fields ---");
  await service.exportToExcel({ start_date: undefined, end_date: undefined });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
