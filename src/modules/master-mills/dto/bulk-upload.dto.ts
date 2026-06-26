import { IsUUID } from 'class-validator';

export class BulkUploadImportDto {
  @IsUUID()
  importId: string;
}
