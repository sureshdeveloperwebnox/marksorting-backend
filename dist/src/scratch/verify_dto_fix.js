"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const create_mobile_installation_report_dto_1 = require("../src/modules/installation-reports/dto/create-mobile-installation-report.dto");
async function testValidation() {
    const payload = {
        customer_id: '',
        mill_id: '82360103-05fe-40a5-b2a0-796f74394c68',
        place: 'Chennai',
        call_registered_date: '2026-08-15',
        machine_model: 'JD-Model 2',
        serial_or_frame_no: 'JD-FN002',
        authorized_person: 'Sanjay',
        authorized_person_phone: '',
        invoice_number: 'JDINV-002',
        invoice_date: '2026-08-14',
        warranty_start_date: '2026-08-15',
        warranty_end_date: '2028-02-14',
        warranty_years: 0,
        warranty_months: 18,
        commodity: 'com',
        contamination: 'con',
        output_capacity_per_hour: 5,
        rejection_ratio: 'rat',
        purity: 'pur',
        no_of_programs_set: 5,
        ac_provided: false,
        compressor_details: 'com',
        air_drier_details: 2,
        ground_earth_provided: true,
        no_of_filters_installed: 5,
        oil_filter_condition: 'test',
        line_filter_condition: 5,
        auto_drain_valve_working: true,
        running_channel_combination: 3,
        running_channel_combination_value: 'PRIMARY',
        engineer_remarks: 'eng',
        engineer_signature: 'data:image/png;base64,...',
        customer_signature: 'data:image/png;base64,...',
        mill_email: '',
        customer_remarks: 'rem',
        technician_id: '21b0d30b-07cf-40c0-8c3c-6a432825fd0e',
        status: 'PENDING',
        machine_mfg_date: '2026-08-14',
        amc_period: 18,
        amc_start_date: '',
        amc_closing_date: '',
        amc_amount: 8000.0,
        amc_particular: 'AMC Without spare',
    };
    const dtoInstance = (0, class_transformer_1.plainToInstance)(create_mobile_installation_report_dto_1.CreateMobileInstallationReportDto, payload, { enableImplicitConversion: true });
    const errors = await (0, class_validator_1.validate)(dtoInstance, {
        whitelist: true,
        forbidNonWhitelisted: true,
    });
    if (errors.length === 0) {
        console.log('SUCCESS: Payload passed validation without any errors!');
    }
    else {
        console.error('VALIDATION FAILED with errors:');
        console.dir(errors, { depth: null });
    }
}
testValidation();
//# sourceMappingURL=verify_dto_fix.js.map