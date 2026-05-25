import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { DocumentTemplateService } from './templates/document-template.service';

@Module({
  providers: [PdfService, DocumentTemplateService],
  exports: [PdfService, DocumentTemplateService],
})
export class PdfModule {}
