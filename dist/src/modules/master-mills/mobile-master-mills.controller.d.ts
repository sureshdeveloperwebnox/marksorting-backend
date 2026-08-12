import { MasterMillsService } from './master-mills.service';
import { QuickRegisterDto } from './dto/quick-register.dto';
export declare class MobileMasterMillsController {
    private readonly masterMillsService;
    constructor(masterMillsService: MasterMillsService);
    findForPrefill(search?: string, refNo?: string, frameNo?: string, context?: 'service_report' | 'installation_report'): Promise<any[] | {
        serviceBased: any[];
        installationBased: any[];
    }>;
    quickRegister(dto: QuickRegisterDto): Promise<any>;
}
