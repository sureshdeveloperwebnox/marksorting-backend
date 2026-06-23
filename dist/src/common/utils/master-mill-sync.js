"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncInstallationToMasterMill = syncInstallationToMasterMill;
exports.syncServiceToMasterMill = syncServiceToMasterMill;
async function syncInstallationToMasterMill(tx, report, redis) {
    const millId = report.mill_id;
    const serialOrFrameNo = report.serial_or_frame_no.trim();
    const mill = await tx.mill.findUnique({
        where: { id: millId },
        select: { ref_no: true, address: true, place: true, phone: true },
    });
    const existingMasterMill = await tx.masterMill.findFirst({
        where: {
            deleted_at: null,
            OR: [
                { mill_id: millId },
                { frame_no: { equals: serialOrFrameNo, mode: 'insensitive' } },
            ],
        },
    });
    const now = new Date();
    const warrantyEndDate = report.warranty_end_date ? new Date(report.warranty_end_date) : null;
    const warrantyStartDate = report.warranty_start_date ? new Date(report.warranty_start_date) : null;
    let all_warranty = 'Non Warranty';
    if (warrantyEndDate && warrantyEndDate >= now) {
        all_warranty = 'Under Warranty';
    }
    else if (existingMasterMill?.amc_closing_date && new Date(existingMasterMill.amc_closing_date) >= now) {
        all_warranty = 'Under AMC';
    }
    let warranty_years = existingMasterMill?.warranty_years ?? 0;
    let warranty_months = existingMasterMill?.warranty_months ?? 0;
    if (warrantyStartDate && warrantyEndDate) {
        let years = warrantyEndDate.getFullYear() - warrantyStartDate.getFullYear();
        let months = warrantyEndDate.getMonth() - warrantyStartDate.getMonth();
        if (months < 0) {
            years--;
            months += 12;
        }
        warranty_years = Math.max(0, years);
        warranty_months = Math.max(0, months);
    }
    const invoiceNo = report.invoice_number?.trim() || existingMasterMill?.invoice_no || `INV-IR-${serialOrFrameNo}-${Date.now()}`;
    const data = {
        invoice_no: invoiceNo,
        invoice_date: report.invoice_date ? new Date(report.invoice_date) : (existingMasterMill?.invoice_date ? new Date(existingMasterMill.invoice_date) : null),
        ref_no: mill?.ref_no || existingMasterMill?.ref_no || null,
        mill_id: millId,
        address: mill?.address || existingMasterMill?.address || null,
        place: report.place || mill?.place || existingMasterMill?.place || null,
        phone_no: report.mill_whatsapp_number || mill?.phone || existingMasterMill?.phone_no || null,
        mc_model: report.machine_model,
        frame_no: serialOrFrameNo,
        installation_date: warrantyStartDate || new Date(report.visit_date),
        warranty_closing_date: warrantyEndDate,
        warranty_years,
        warranty_months,
        all_warranty,
        type: 'Installation',
        status: 'ACTIVE',
    };
    let masterMillId;
    if (existingMasterMill) {
        const updated = await tx.masterMill.update({
            where: { id: existingMasterMill.id },
            data,
        });
        masterMillId = updated.id;
    }
    else {
        const created = await tx.masterMill.create({
            data,
        });
        masterMillId = created.id;
    }
    await redis.delByPrefix('master_mills:list:');
    await redis.del(`master_mill:id:${masterMillId}`);
}
async function syncServiceToMasterMill(tx, report, redis) {
    const millId = report.mill_id;
    const serialOrFrameNo = report.serial_or_frame_no.trim();
    const mill = await tx.mill.findUnique({
        where: { id: millId },
        select: { ref_no: true, address: true, place: true, phone: true },
    });
    const existingMasterMill = await tx.masterMill.findFirst({
        where: {
            deleted_at: null,
            OR: [
                { mill_id: millId },
                { frame_no: { equals: serialOrFrameNo, mode: 'insensitive' } },
            ],
        },
    });
    const now = new Date();
    const machineInstallationDate = report.machine_installation_date ? new Date(report.machine_installation_date) : null;
    const installationDate = machineInstallationDate || existingMasterMill?.installation_date || new Date(report.visit_date);
    let warrantyClosingDate = existingMasterMill?.warranty_closing_date ? new Date(existingMasterMill.warranty_closing_date) : null;
    if (machineInstallationDate && existingMasterMill && (existingMasterMill.warranty_years || existingMasterMill.warranty_months)) {
        const years = existingMasterMill.warranty_years ?? 0;
        const months = existingMasterMill.warranty_months ?? 0;
        const closing = new Date(machineInstallationDate);
        closing.setFullYear(closing.getFullYear() + years);
        closing.setMonth(closing.getMonth() + months);
        warrantyClosingDate = closing;
    }
    let all_warranty = 'Non Warranty';
    if (warrantyClosingDate && warrantyClosingDate >= now) {
        all_warranty = 'Under Warranty';
    }
    else if (existingMasterMill?.amc_closing_date && new Date(existingMasterMill.amc_closing_date) >= now) {
        all_warranty = 'Under AMC';
    }
    const invoiceNo = existingMasterMill?.invoice_no || `INV-SR-${serialOrFrameNo}-${Date.now()}`;
    const data = {
        invoice_no: invoiceNo,
        ref_no: mill?.ref_no || existingMasterMill?.ref_no || null,
        mill_id: millId,
        address: mill?.address || existingMasterMill?.address || null,
        place: report.place || mill?.place || existingMasterMill?.place || null,
        phone_no: report.mill_whatsapp_number || mill?.phone || existingMasterMill?.phone_no || null,
        mc_model: report.machine_model,
        frame_no: serialOrFrameNo,
        installation_date: installationDate,
        warranty_closing_date: warrantyClosingDate,
        all_warranty,
        status: 'ACTIVE',
    };
    let masterMillId;
    if (existingMasterMill) {
        const updated = await tx.masterMill.update({
            where: { id: existingMasterMill.id },
            data,
        });
        masterMillId = updated.id;
    }
    else {
        const created = await tx.masterMill.create({
            data: {
                ...data,
                type: 'Service',
            },
        });
        masterMillId = created.id;
    }
    await redis.delByPrefix('master_mills:list:');
    await redis.del(`master_mill:id:${masterMillId}`);
}
//# sourceMappingURL=master-mill-sync.js.map