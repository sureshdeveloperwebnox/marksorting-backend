import { CreateInstallationReportDto } from './create-installation-report.dto';
declare const CreateMobileInstallationReportDto_base: import("@nestjs/common").Type<Omit<CreateInstallationReportDto, "technician_ids">>;
export declare class CreateMobileInstallationReportDto extends CreateMobileInstallationReportDto_base {
    technician_id?: string;
}
export {};
