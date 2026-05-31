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
exports.validationSchema = void 0;
const Joi = __importStar(require("joi"));
exports.validationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    PORT: Joi.number().default(4000),
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.string().required(),
    JWT_REFRESH_SECRET: Joi.string().required(),
    JWT_REFRESH_EXPIRES_IN: Joi.string().required(),
    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().default(6379),
    FOLDER_NAME: Joi.string().required(),
    BUCKET_NAME: Joi.string().required(),
    REGION: Joi.string().required(),
    ACCESS_KEY: Joi.string().required(),
    SECRET_ACCESS_KEY: Joi.string().required(),
    S3_BASE_URL: Joi.string().uri().required(),
    FIREBASE_PROJECT_ID: Joi.string().optional().allow(''),
    FIREBASE_CLIENT_EMAIL: Joi.string().optional().allow(''),
    FIREBASE_PRIVATE_KEY: Joi.string().optional().allow(''),
    SMTP_HOST: Joi.string().default('smtp.gmail.com'),
    SMTP_PORT: Joi.number().default(465),
    SMTP_USER: Joi.string().optional().allow(''),
    APP_PASSWORD: Joi.string().optional().allow(''),
    SMTP_FROM_NAME: Joi.string().default('Mark Sorting System'),
    FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
});
//# sourceMappingURL=validation.js.map