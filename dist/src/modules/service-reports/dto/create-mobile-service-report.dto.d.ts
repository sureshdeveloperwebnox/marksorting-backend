import { CreateServiceReportDto } from './create-service-report.dto';
declare const CreateMobileServiceReportDto_base: import("@nestjs/common").Type<Omit<CreateServiceReportDto, "technician_ids">>;
export declare class CreateMobileServiceReportDto extends CreateMobileServiceReportDto_base {
    technician_id?: string;
}
export {};
