"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mail_templates_1 = require("../modules/mail/templates/mail-templates");
function render() {
    const html = (0, mail_templates_1.getForgotPasswordTemplate)('Test User', 'http://localhost:3000/reset-password?token=abcdef123456', 60, 'http://localhost:3000');
    console.log('--- GENERATED HTML TEMPLATE ---');
    console.log(html);
    console.log('-------------------------------');
}
render();
//# sourceMappingURL=render-template.js.map