/**
 * Human-readable field label mappings used across all activity log descriptions.
 * Maps DB/DTO field names → plain English labels.
 */
export const FIELD_LABELS: Record<string, string> = {
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

/** Fields that should never appear in change summaries (binary/sensitive/UUID data) */
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
  // UUID reference fields — unreadable to end users
  'customer_id',
  'mill_id',
  'role_id',
  'expense_category_id',
  'service_category_id',
  'material_id',
  'user_id',
  'report_id',
  'store_id',
  // Internal system fields
  'id',
  'created_at',
  'updated_at',
  'deleted_at',
]);

/**
 * Format a single field value for display.
 * Truncates long strings, formats dates, hides blobs.
 */
function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '(cleared)';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return `${value.length} item(s)`;
  if (typeof value === 'string') {
    if (value.startsWith('data:image')) return '(image updated)';
    if (value.length > 60) return `"${value.substring(0, 57)}..."`;
    return `"${value}"`;
  }
  if (typeof value === 'number') {
    if (key === 'amount') return `₹${value}`;
    return String(value);
  }
  return String(value);
}

/**
 * Builds a human-readable change summary from a DTO body (partial update payload).
 * Shows only what was submitted, not a before/after diff.
 * Use buildDiffSummary when you have the before state available.
 */
export function buildChangeSummary(body: Record<string, unknown>): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(body)) {
    if (SKIP_FIELDS.has(key)) continue;
    if (value === undefined) continue;

    const label = FIELD_LABELS[key] ?? key.replace(/_/g, ' ');
    parts.push(`${label} → ${formatValue(key, value)}`);
  }

  return parts.join(', ');
}

/**
 * Builds a true before → after diff summary.
 * Only includes fields that actually changed value.
 * Example: "Name: \"Shree\" → \"Shree Enterprises\", Status: \"ACTIVE\" → \"INACTIVE\""
 */
export function buildDiffSummary(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  body: Record<string, unknown>,
): string {
  const parts: string[] = [];

  for (const key of Object.keys(body)) {
    if (SKIP_FIELDS.has(key)) continue;
    if (body[key] === undefined) continue;

    const oldVal = before[key];
    const newVal = after[key];

    // Only include if value actually changed
    const oldStr = oldVal === null || oldVal === undefined ? '' : String(oldVal);
    const newStr = newVal === null || newVal === undefined ? '' : String(newVal);
    if (oldStr === newStr) continue;

    const label = FIELD_LABELS[key] ?? key.replace(/_/g, ' ');
    parts.push(`${label}: ${formatValue(key, oldVal)} → ${formatValue(key, newVal)}`);
  }

  return parts.join(', ');
}

/**
 * Produces a complete UPDATE description with actor name.
 * Format: <Actor> updated <entity> "<name>" — <change summary>
 */
export function updateDescription(
  entityLabel: string,
  name: string,
  body: Record<string, unknown>,
  actor?: string,
): string {
  const changes = buildChangeSummary(body);
  const who = actor ? `${actor} updated` : 'Updated';
  const changesPart = changes ? ` — ${changes}` : '';
  return `${who} ${entityLabel} "${name}"${changesPart}`;
}

/**
 * Produces a complete CREATE description with actor name.
 * Format: <Actor> created <entity> "<name>" — <key details>
 */
export function createDescription(
  entityLabel: string,
  name: string,
  details?: string,
  actor?: string,
): string {
  const who = actor ? `${actor} created` : 'Created';
  const detailsPart = details ? ` — ${details}` : '';
  return `${who} ${entityLabel} "${name}"${detailsPart}`;
}

/**
 * Produces a complete DELETE description with actor name.
 * Format: <Actor> deleted <entity> "<name>"
 */
export function deleteDescription(entityLabel: string, name: string, actor?: string): string {
  const who = actor ? `${actor} deleted` : 'Deleted';
  return `${who} ${entityLabel} "${name}"`;
}
