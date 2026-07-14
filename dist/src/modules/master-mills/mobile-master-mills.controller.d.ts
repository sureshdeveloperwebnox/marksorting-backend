import { MasterMillsService } from './master-mills.service';
import { QuickRegisterDto } from './dto/quick-register.dto';
export declare class MobileMasterMillsController {
    private readonly masterMillsService;
    constructor(masterMillsService: MasterMillsService);
    findForPrefill(search?: string, refNo?: string, frameNo?: string, context?: 'service_report' | 'installation_report'): Promise<any[] | {
        serviceBased: any[];
        installationBased: any[];
    }>;
    quickRegister(dto: QuickRegisterDto): Promise<{
        _isUpdate: boolean;
        mill?: ({
            customer: {
                id: string;
                created_at: Date;
                email: string | null;
                updated_at: Date;
                deleted_at: Date | null;
                name: string;
                status: string;
                phone: string | null;
                address: string | null;
            } | null;
        } & {
            id: string;
            created_at: Date;
            email: string | null;
            updated_at: Date;
            deleted_at: Date | null;
            name: string;
            status: string;
            place: string | null;
            phone: string | null;
            ref_no: string | null;
            address: string | null;
            customer_id: string | null;
            city: string | null;
            phone_2: string | null;
            phone_3: string | null;
        }) | null | undefined;
        id?: string | undefined;
        created_at?: Date | undefined;
        updated_at?: Date | undefined;
        deleted_at?: Date | null | undefined;
        status?: string | undefined;
        type?: string | undefined;
        mill_id?: string | null | undefined;
        place?: string | null | undefined;
        invoice_date?: Date | null | undefined;
        warranty_start_date?: Date | null | undefined;
        invoice_no?: string | undefined;
        ref_no?: string | null | undefined;
        address?: string | null | undefined;
        state?: string | null | undefined;
        phone_no?: string | null | undefined;
        mc_model?: string | null | undefined;
        frame_no?: string | null | undefined;
        mfg_date?: Date | null | undefined;
        warranty_years?: number | null | undefined;
        warranty_months?: number | null | undefined;
        installation_date?: Date | null | undefined;
        warranty_closing_date?: Date | null | undefined;
        all_warranty?: string | null | undefined;
        amc_starting_date?: Date | null | undefined;
        amc_period?: number | null | undefined;
        amc_particular?: string | null | undefined;
        amc_closing_date?: Date | null | undefined;
        amc_amount?: import("@prisma/client/runtime/client").Decimal | null | undefined;
    }>;
}
