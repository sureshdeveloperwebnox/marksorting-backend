import { Global, Module } from '@nestjs/common';
import { S3Service } from './services/s3.service';
import { ExcelParserService } from './services/excel-parser.service';

@Global()
@Module({
  providers: [S3Service, ExcelParserService],
  exports: [S3Service, ExcelParserService],
})
export class SharedModule {}
