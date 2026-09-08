import { CreateInstallationReportDto } from './create-installation-report.dto';
declare const CreateMobileInstallationReportDto_base: import("@nestjs/common").Type<Omit<CreateInstallationReportDto, "technician_ids" | "visit_date" | "visit_time">>;
export declare class CreateMobileInstallationReportDto extends CreateMobileInstallationReportDto_base {
    technician_id?: string;
    technician_ids?: string[];
}
export {};
