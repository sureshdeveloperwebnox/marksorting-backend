export declare class CreateExpenseItemDto {
    expense_category_id: string;
    amount: number;
    admin_amount?: number;
    remarks?: string;
    admin_remarks?: string;
    expense_images?: string[];
}
export declare class CreateExpenseDto {
    expense_type?: string;
    technician_ids?: string[];
    customer_id?: string;
    mill_id?: string;
    place?: string;
    visit_date?: string;
    visit_time?: string;
    expense_category_id?: string;
    expense_items?: CreateExpenseItemDto[];
    others?: string;
    remarks?: string;
    amount?: number;
    admin_amount?: number;
    expense_images?: string[];
    status?: string;
    service_report_id?: string;
    installation_report_id?: string;
}
