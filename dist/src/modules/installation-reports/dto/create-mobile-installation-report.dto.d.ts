import { CreateInstallationReportDto } from './create-installation-report.dto';
declare const CreateMobileInstallationReportDto_base: import("@nestjs/common").Type<Omit<CreateInstallationReportDto, "visit_date" | "visit_time" | "technician_ids">>;
export declare class CreateMobileInstallationReportDto extends CreateMobileInstallationReportDto_base {
    technician_id?: string;
}
export {};
