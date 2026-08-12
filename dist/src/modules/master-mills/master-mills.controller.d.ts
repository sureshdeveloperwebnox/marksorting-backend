import { MasterMillsService } from './master-mills.service';
import { CreateMasterMillDto } from './dto/create-master-mill.dto';
import { UpdateMasterMillDto } from './dto/update-master-mill.dto';
import { QuickRegisterDto } from './dto/quick-register.dto';
export declare class MasterMillsController {
    private readonly masterMillsService;
    constructor(masterMillsService: MasterMillsService);
    findAll(skip?: string, take?: string, search?: string, status?: string, state?: string, allWarranty?: string, millId?: string, type?: string, dateFrom?: string, dateTo?: string): Promise<any>;
    getStats(): Promise<any>;
    findForPrefill(search?: string, refNo?: string, frameNo?: string, context?: 'service_report' | 'installation_report'): Promise<any[] | {
        serviceBased: any[];
        installationBased: any[];
    }>;
    findOne(id: string): Promise<any>;
    create(dto: CreateMasterMillDto): Promise<any>;
    quickRegister(dto: QuickRegisterDto): Promise<any>;
    update(id: string, dto: UpdateMasterMillDto): Promise<{
        before: any;
        after: any;
    }>;
    remove(id: string): Promise<any>;
}
