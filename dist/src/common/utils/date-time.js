"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAutoVisitTime = getAutoVisitTime;
function getAutoVisitTime(date = new Date()) {
    try {
        const formatter = new Intl.DateTimeFormat('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
        const parts = formatter.formatToParts(date);
        const hour = parts.find((p) => p.type === 'hour')?.value || '00';
        const minute = parts.find((p) => p.type === 'minute')?.value || '00';
        return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    }
    catch (e) {
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        return `${hour}:${minute}`;
    }
}
//# sourceMappingURL=date-time.js.map