require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const XLSX = require('xlsx');
const fs = require('fs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$connect();
  console.log("Connected");

  const logs = await prisma.activityLog.findMany({
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
  });

  console.log("Found logs:", logs.length);

  // Prepare data for Excel
  const exportData = logs.map((log, index) => ({
    'Sr. No.': index + 1,
    'Date & Time': new Date(log.created_at).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }),
    'User Name': log.user?.full_name || 'Unknown',
    'User Email': log.user?.email || '-',
    'User ID': log.user_id,
    'Action': log.action,
    'Entity Type': log.entity_type || '-',
    'Entity ID': log.entity_id || '-',
    'Description': log.description,
    'IP Address': log.ip_address || '-',
    'User Agent': log.user_agent || '-',
    'Device Name': log.device_name || '-',
    'Metadata': log.metadata ? JSON.stringify(log.metadata) : '-',
  }));

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  const colWidths = [
    { wch: 8 },   // Sr. No.
    { wch: 22 },  // Date & Time
    { wch: 25 },  // User Name
    { wch: 30 },  // User Email
    { wch: 36 },  // User ID
    { wch: 12 },  // Action
    { wch: 20 },  // Entity Type
    { wch: 36 },  // Entity ID
    { wch: 50 },  // Description
    { wch: 15 },  // IP Address
    { wch: 40 },  // User Agent
    { wch: 20 },  // Device Name
    { wch: 50 },  // Metadata
  ];
  ws['!cols'] = colWidths;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Activity Logs');

  // Generate buffer
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  console.log("Buffer created, type:", typeof buffer, "isBuffer:", Buffer.isBuffer(buffer), "length:", buffer.length);

  fs.writeFileSync('test_output.xlsx', buffer);
  console.log("Wrote test_output.xlsx successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
