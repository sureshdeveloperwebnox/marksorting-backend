"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer = __importStar(require("nodemailer"));
async function testMail() {
    const user = 'sureshdeveloperwebnox@gmail.com';
    const pass = 'azbeavexnqdqrdgz';
    console.log(`Setting up Nodemailer with service: gmail, user: ${user}`);
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user,
            pass,
        },
    });
    try {
        const info = await transporter.sendMail({
            from: `"Mark Sorting System" <${user}>`,
            to: 'sureshdeveloperwebnox@gmail.com',
            subject: 'SMTP Connection Test - Success',
            html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ff6b00; border-radius: 12px; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #ff6b00;">SMTP Test Successful!</h2>
          <p>This email verifies that the app password is valid and Gmail SMTP works perfectly.</p>
          <p>Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
        });
        console.log('Email sent successfully!', info.messageId);
    }
    catch (error) {
        console.error('Failed to send email:', error);
    }
}
testMail();
//# sourceMappingURL=test-mail.js.map