/**
 * Formats the current time or a given date to HH:mm (24-hour format)
 * using the Asia/Kolkata timezone (IST) as the primary format,
 * falling back to local server time.
 */
export function getAutoVisitTime(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    // Intl.DateTimeFormat 'en-IN' with 24-hour can return "10:30" or sometimes have characters.
    // Let's clean the output to ensure it's precisely HH:mm.
    const parts = formatter.formatToParts(date);
    const hour = parts.find((p) => p.type === 'hour')?.value || '00';
    const minute = parts.find((p) => p.type === 'minute')?.value || '00';
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  } catch (e) {
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${hour}:${minute}`;
  }
}
