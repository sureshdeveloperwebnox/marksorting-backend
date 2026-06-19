import { MasterMillsService } from './master-mills.service';
import { QuickRegisterDto } from './dto/quick-register.dto';
export declare class MobileMasterMillsController {
    private readonly masterMillsService;
    constructor(masterMillsService: MasterMillsService);
    findForPrefill(search?: string, refNo?: string, frameNo?: string): Promise<({
        mill: ({
            customer: {
                id: string;
                name: string;
                email: string | null;
                phone: string | null;
            } | null;
        } & {
            id: string;
            ref_no: string | null;
            address: string | null;
            place: string | null;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            name: string;
            email: string | null;
            phone: string | null;
            customer_id: string | null;
            city: string | null;
            phone_2: string | null;
            phone_3: string | null;
        }) | null;
    } & {
        id: string;
        invoice_no: string;
        invoice_date: Date | null;
        ref_no: string | null;
        mill_id: string | null;
        address: string | null;
        place: string | null;
        state: string | null;
        phone_no: string | null;
        mc_model: string | null;
        frame_no: string | null;
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
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        type: string;
    })[]>;
    quickRegister(dto: QuickRegisterDto): Promise<({
        mill: ({
            customer: {
                id: string;
                address: string | null;
                status: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                name: string;
                email: string | null;
                phone: string | null;
            } | null;
        } & {
            id: string;
            ref_no: string | null;
            address: string | null;
            place: string | null;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            name: string;
            email: string | null;
            phone: string | null;
            customer_id: string | null;
            city: string | null;
            phone_2: string | null;
            phone_3: string | null;
        }) | null;
    } & {
        id: string;
        invoice_no: string;
        invoice_date: Date | null;
        ref_no: string | null;
        mill_id: string | null;
        address: string | null;
        place: string | null;
        state: string | null;
        phone_no: string | null;
        mc_model: string | null;
        frame_no: string | null;
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
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        type: string;
    }) | null>;
}
