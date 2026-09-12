"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIELD_LABELS = void 0;
exports.buildChangeSummary = buildChangeSummary;
exports.buildDiffSummary = buildDiffSummary;
exports.updateDescription = updateDescription;
exports.createDescription = createDescription;
exports.deleteDescription = deleteDescription;
exports.FIELD_LABELS = {
    name: 'Name',
    full_name: 'Full Name',
    email: 'Email',
    phone: 'Phone',
    phone_number: 'Phone Number',
    address: 'Address',
    status: 'Status',
    account_status: 'Account Status',
    role_id: 'Role',
    customer_id: 'Customer',
    mill_id: 'Mill',
    description: 'Description',
    amount: 'Amount',
    place: 'Place',
    visit_date: 'Visit Date',
    visit_time: 'Visit Time',
    machine_model: 'Machine Model',
    serial_or_frame_no: 'Serial / Frame No',
    frame_number: 'Frame Number',
    barcode: 'Barcode',
    warranty_status: 'Warranty Status',
    return_status: 'Return Status',
    inflow_status: 'Inflow Status',
    priority: 'Priority',
    title: 'Title',
    subject: 'Subject',
    key: 'Setting Key',
    value: 'Setting Value',
    group: 'Group',
    profile_image: 'Profile Image',
    background_image: 'Background Image',
    expense_category_id: 'Expense Category',
    service_category_id: 'Service Category',
    others: 'Notes',
    nature_of_complaint: 'Nature of Complaint',
    authorized_person: 'Authorised Person',
    availability_status: 'Availability',
};
const SKIP_FIELDS = new Set([
    'password',
    'password_hash',
    'token',
    'refresh_token',
    'secret',
    'customer_signature',
    'technician_signature',
    'expense_images',
    'technician_ids',
    'technician_id',
    'customer_id',
    'mill_id',
    'role_id',
    'expense_category_id',
    'service_category_id',
    'material_id',
    'user_id',
    'report_id',
    'store_id',
    'id',
    'created_at',
    'updated_at',
    'deleted_at',
]);
function formatValue(key, value) {
    if (value === null || value === undefined || value === '')
        return '(cleared)';
    if (typeof value === 'boolean')
        return value ? 'Yes' : 'No';
    if (Array.isArray(value))
        return `${value.length} item(s)`;
    if (typeof value === 'string') {
        if (value.startsWith('data:image'))
            return '(image updated)';
        if (value.length > 60)
            return `"${value.substring(0, 57)}..."`;
        return `"${value}"`;
    }
    if (typeof value === 'number') {
        if (key === 'amount')
            return `₹${value}`;
        return String(value);
    }
    return String(value);
}
function buildChangeSummary(body) {
    const parts = [];
    for (const [key, value] of Object.entries(body)) {
        if (SKIP_FIELDS.has(key))
            continue;
        if (value === undefined)
            continue;
        const label = exports.FIELD_LABELS[key] ?? key.replace(/_/g, ' ');
        parts.push(`${label} → ${formatValue(key, value)}`);
    }
    return parts.join(', ');
}
function buildDiffSummary(before, after, body) {
    const parts = [];
    for (const key of Object.keys(body)) {
        if (SKIP_FIELDS.has(key))
            continue;
        if (body[key] === undefined)
            continue;
        const oldVal = before[key];
        const newVal = after[key];
        const oldStr = oldVal === null || oldVal === undefined ? '' : String(oldVal);
        const newStr = newVal === null || newVal === undefined ? '' : String(newVal);
        if (oldStr === newStr)
            continue;
        const label = exports.FIELD_LABELS[key] ?? key.replace(/_/g, ' ');
        parts.push(`${label}: ${formatValue(key, oldVal)} → ${formatValue(key, newVal)}`);
    }
    return parts.join(', ');
}
function updateDescription(entityLabel, name, body, actor) {
    const changes = buildChangeSummary(body);
    const who = actor ? `${actor} updated` : 'Updated';
    const changesPart = changes ? ` — ${changes}` : '';
    return `${who} ${entityLabel} "${name}"${changesPart}`;
}
function createDescription(entityLabel, name, details, actor) {
    const who = actor ? `${actor} created` : 'Created';
    const detailsPart = details ? ` — ${details}` : '';
    return `${who} ${entityLabel} "${name}"${detailsPart}`;
}
function deleteDescription(entityLabel, name, actor) {
    const who = actor ? `${actor} deleted` : 'Deleted';
    return `${who} ${entityLabel} "${name}"`;
}
//# sourceMappingURL=description.helper.js.map