import { MasterMillsService } from './master-mills.service';
import { QuickRegisterDto } from './dto/quick-register.dto';
export declare class MobileMasterMillsController {
    private readonly masterMillsService;
    constructor(masterMillsService: MasterMillsService);
    findForPrefill(search?: string, refNo?: string, frameNo?: string): Promise<({
        mill: ({
            customer: {
                id: string;
                email: string | null;
                name: string;
                phone: string | null;
            } | null;
        } & {
            id: string;
            created_at: Date;
            email: string | null;
            updated_at: Date;
            deleted_at: Date | null;
            name: string;
            customer_id: string | null;
            city: string | null;
            place: string | null;
            address: string | null;
            ref_no: string | null;
            phone: string | null;
            status: string;
            phone_2: string | null;
            phone_3: string | null;
        }) | null;
    } & {
        type: string;
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        place: string | null;
        address: string | null;
        ref_no: string | null;
        status: string;
        frame_no: string | null;
        invoice_no: string;
        invoice_date: Date | null;
        mill_id: string | null;
        state: string | null;
        phone_no: string | null;
        mc_model: string | null;
        warranty_years: number | null;
        warranty_months: number | null;
        installation_date: Date | null;
        warranty_closing_date: Date | null;
        all_warranty: string | null;
        amc_starting_date: Date | null;
        amc_period: number | null;
        amc_particular: string | null;
        amc_closing_date: Date | null;
        amc_amount: import("@prisma/client/runtime/client").Decimal | null;
    })[]>;
    quickRegister(dto: QuickRegisterDto): Promise<({
        mill: ({
            customer: {
                id: string;
                created_at: Date;
                email: string | null;
                updated_at: Date;
                deleted_at: Date | null;
                name: string;
                address: string | null;
                phone: string | null;
                status: string;
            } | null;
        } & {
            id: string;
            created_at: Date;
            email: string | null;
            updated_at: Date;
            deleted_at: Date | null;
            name: string;
            customer_id: string | null;
            city: string | null;
            place: string | null;
            address: string | null;
            ref_no: string | null;
            phone: string | null;
            status: string;
            phone_2: string | null;
            phone_3: string | null;
        }) | null;
    } & {
        type: string;
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        place: string | null;
        address: string | null;
        ref_no: string | null;
        status: string;
        frame_no: string | null;
        invoice_no: string;
        invoice_date: Date | null;
        mill_id: string | null;
        state: string | null;
        phone_no: string | null;
        mc_model: string | null;
        warranty_years: number | null;
        warranty_months: number | null;
        installation_date: Date | null;
        warranty_closing_date: Date | null;
        all_warranty: string | null;
        amc_starting_date: Date | null;
        amc_period: number | null;
        amc_particular: string | null;
        amc_closing_date: Date | null;
        amc_amount: import("@prisma/client/runtime/client").Decimal | null;
    }) | null>;
}
