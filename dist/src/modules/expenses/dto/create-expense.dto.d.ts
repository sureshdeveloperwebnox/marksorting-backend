export declare class CreateExpenseDto {
    technician_ids: string[];
    mill_id?: string;
    place?: string;
    visit_date: string;
    visit_time: string;
    expense_type: string;
    others?: string;
    amount?: number;
    expense_images?: string[];
    status?: string;
}
