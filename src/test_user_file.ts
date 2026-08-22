import * as fs from 'fs';
import { ExcelParserService } from './shared/services/excel-parser.service';
import { MasterMillsBulkService } from './modules/master-mills/master-mills-bulk.service';
import { PrismaService } from './prisma/prisma.service';
import * as dotenv from 'dotenv';
dotenv.config();

async function testFile(bulkService: MasterMillsBulkService, filePath: string, fileName: string) {
  console.log(`\n================ Testing: ${fileName} ================`);
  const buffer = fs.readFileSync(filePath);
  const preview = await bulkService.previewUpload({
    buffer,
    fieldname: 'file',
    originalname: fileName,
    encoding: '7bit',
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: buffer.length,
  });

  console.log('Total Rows:', preview.totalRows);
  console.log('Valid Rows:', preview.validRows);
  console.log('Invalid Rows:', preview.invalidRows);

  let errorCount = 0;
  for (let i = 0; i < preview.rows.length; i++) {
    const r = preview.rows[i];
    if (!r.isValid) {
      errorCount++;
      console.log(`Row ${i + 1} ERROR:`, JSON.stringify(r.errors));
    }
  }
  if (errorCount === 0) {
    console.log('>>> SUCCESS: ALL ROWS ARE VALID! <<<');
  }
}

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();
  const parser = new ExcelParserService();
  const redis: any = { setJson: async () => {}, getJson: async () => null };
  const bulkService = new MasterMillsBulkService(parser, {} as any, redis, prisma);

  await testFile(bulkService, 'd:/Office/marksorting/Template-1.0.xlsx', 'Template-1.0.xlsx');
  await testFile(bulkService, 'd:/Office/marksorting/sindhu.xlsx', 'sindhu.xlsx');

  await prisma.$disconnect();
}

main().catch(console.error);
