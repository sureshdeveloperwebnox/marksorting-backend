import { CreateServiceReportDto } from './create-service-report.dto';
declare const CreateMobileServiceReportDto_base: import("@nestjs/common").Type<Omit<CreateServiceReportDto, "visit_date" | "technician_ids">>;
export declare class CreateMobileServiceReportDto extends CreateMobileServiceReportDto_base {
    technician_id?: string;
    technician_ids?: string[];
    visit_date?: string;
}
export {};
