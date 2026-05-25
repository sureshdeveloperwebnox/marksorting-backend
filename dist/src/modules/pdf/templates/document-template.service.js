"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentTemplateService = void 0;
const common_1 = require("@nestjs/common");
let DocumentTemplateService = class DocumentTemplateService {
    escape(value) {
        if (value === null || value === undefined)
            return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    text(value, fallback = '-') {
        const escaped = this.escape(value);
        return escaped.trim() ? escaped : fallback;
    }
    date(value, fallback = '-') {
        if (!value)
            return fallback;
        const date = new Date(String(value));
        if (Number.isNaN(date.getTime()))
            return fallback;
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(date);
    }
    yesNo(value) {
        return value ? 'yes' : 'no';
    }
    imageSrc(value) {
        const src = this.escape(value);
        if (!src)
            return '';
        if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:image/')) {
            return src;
        }
        return '';
    }
};
exports.DocumentTemplateService = DocumentTemplateService;
exports.DocumentTemplateService = DocumentTemplateService = __decorate([
    (0, common_1.Injectable)()
], DocumentTemplateService);
//# sourceMappingURL=document-template.service.js.map