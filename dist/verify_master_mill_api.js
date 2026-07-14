"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
async function testCreate() {
    const backendUrl = 'http://localhost:4000/api/v1';
    console.log('Logging in...');
    const loginRes = await axios_1.default.post(`${backendUrl}/auth/login`, {
        email: 'admin@marksorting.com',
        password: 'NewVetri@123',
    });
    const token = loginRes.data.access_token;
    console.log('Logged in successfully!');
    console.log('Sending post request to create master mill...');
    const createRes = await axios_1.default.post(`${backendUrl}/master-mills`, {
        invoice_no: 'INV-TEST-HTTP-002',
        type: 'Installation',
        ref_no: 'REF-HTTP-TEST2',
        invoice_date: '',
        installation_date: '',
        amc_starting_date: '',
        amc_closing_date: '',
        warranty_closing_date: '',
    }, {
        headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Creation response status:', createRes.status);
    console.log('Created record:', createRes.data);
}
testCreate().catch((err) => {
    console.error('Unhandled rejection:', err.message, err.response?.data);
});
//# sourceMappingURL=verify_master_mill_api.js.map