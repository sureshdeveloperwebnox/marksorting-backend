"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const excel_parser_service_1 = require("./shared/services/excel-parser.service");
const master_mills_bulk_service_1 = require("./modules/master-mills/master-mills-bulk.service");
const prisma_service_1 = require("./prisma/prisma.service");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function testFile(bulkService, filePath, fileName) {
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
    const prisma = new prisma_service_1.PrismaService();
    await prisma.$connect();
    const parser = new excel_parser_service_1.ExcelParserService();
    const redis = { setJson: async () => { }, getJson: async () => null };
    const bulkService = new master_mills_bulk_service_1.MasterMillsBulkService(parser, {}, redis, prisma);
    await testFile(bulkService, 'd:/Office/marksorting/Template-1.0.xlsx', 'Template-1.0.xlsx');
    await testFile(bulkService, 'd:/Office/marksorting/sindhu.xlsx', 'sindhu.xlsx');
    await prisma.$disconnect();
}
main().catch(console.error);
//# sourceMappingURL=test_user_file.js.map