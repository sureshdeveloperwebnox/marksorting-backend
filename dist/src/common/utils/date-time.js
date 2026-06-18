"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAutoVisitTime = getAutoVisitTime;
exports.parseDuration = parseDuration;
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
function parseDuration(duration, fallbackMs) {
    if (!duration)
        return fallbackMs;
    if (/^\d+$/.test(duration)) {
        return parseInt(duration, 10) * 1000;
    }
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match)
        return fallbackMs;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
        case 's':
            return value * 1000;
        case 'm':
            return value * 60 * 1000;
        case 'h':
            return value * 60 * 60 * 1000;
        case 'd':
            return value * 24 * 60 * 60 * 1000;
        default:
            return fallbackMs;
    }
}
//# sourceMappingURL=date-time.js.map