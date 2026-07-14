"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const create_master_mill_dto_1 = require("./src/modules/master-mills/dto/create-master-mill.dto");
async function test() {
    const data = {
        invoice_no: 'INV-TEST-001',
        amc_closing_date: '',
        warranty_closing_date: '',
        ref_no: 'REF-TEST',
        type: 'Installation'
    };
    const instance = (0, class_transformer_1.plainToInstance)(create_master_mill_dto_1.CreateMasterMillDto, data, { enableImplicitConversion: true });
    console.log('Transformed instance:', instance);
    const errors = await (0, class_validator_1.validate)(instance);
    console.log('Validation errors count:', errors.length);
    if (errors.length > 0) {
        errors.forEach(err => {
            console.log(`- Property: ${err.property}`);
            console.log(`  Constraints:`, err.constraints);
        });
    }
    else {
        console.log('Validation passed!');
    }
}
test().catch(console.error);
//# sourceMappingURL=verify_dto.js.map