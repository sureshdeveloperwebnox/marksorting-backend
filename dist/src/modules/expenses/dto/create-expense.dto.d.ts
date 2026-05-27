export declare class CreateExpenseDto {
    technician_ids?: string[];
    customer_id?: string;
    mill_id?: string;
    place?: string;
    visit_date: string;
    visit_time: string;
    expense_category_id: string;
    others?: string;
    amount?: number;
    expense_images?: string[];
    status?: string;
}
