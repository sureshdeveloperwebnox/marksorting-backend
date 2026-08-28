"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeWarrantyStatus = normalizeWarrantyStatus;
exports.isAcknowledgeRequired = isAcknowledgeRequired;
function normalizeWarrantyStatus(val) {
    if (!val)
        return 'Non Warranty';
    const trimmed = val.trim().toLowerCase();
    if (trimmed === 'warranty')
        return 'Warranty';
    if (trimmed === 'under amc' || trimmed === 'amc with spare')
        return 'AMC With Spare';
    if (trimmed === 'amc without spare')
        return 'AMC Without Spare';
    if (trimmed === 'non warranty')
        return 'Non Warranty';
    return val.trim();
}
function isAcknowledgeRequired(warrantyStatus) {
    if (!warrantyStatus)
        return true;
    const normalized = normalizeWarrantyStatus(warrantyStatus).toLowerCase();
    return normalized === 'non warranty' || normalized === 'amc without spare';
}
//# sourceMappingURL=store-warranty.helper.js.map