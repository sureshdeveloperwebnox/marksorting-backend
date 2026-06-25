import { Injectable } from '@nestjs/common';

@Injectable()
export class DocumentTemplateService {
  escape(value: unknown): string {
    if (value === null || value === undefined) return '';

    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  text(value: unknown, fallback = '-'): string {
    const escaped = this.escape(value);
    return escaped.trim() ? escaped : fallback;
  }

  time(value: unknown, fallback = '-'): string {
    if (!value) return fallback;
    const timeStr = String(value).trim();
    if (!timeStr) return fallback;

    // Check if already has AM/PM
    if (/(am|pm)/i.test(timeStr)) {
      return timeStr;
    }

    // Match HH:MM or HH:MM:SS
    const match = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      return `${hours}:${minutes} ${ampm}`;
    }

    return timeStr;
  }

  date(value: unknown, fallback = '-'): string {
    if (!value) return fallback;
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return fallback;

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  yesNo(value: unknown): string {
    return value ? 'yes' : 'no';
  }

  status(value: unknown): string {
    if (!value) return '-';
    const statusStr = String(value).toUpperCase().trim();
    const mapping: Record<string, string> = {
      PENDING: 'Pending',
      IN_PROGRESS: 'Work In Progress',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    };
    return mapping[statusStr] || this.text(value);
  }

  imageSrc(value: unknown): string {
    const src = this.escape(value);
    if (!src) return '';
    if (
      src.startsWith('http://') ||
      src.startsWith('https://') ||
      src.startsWith('data:image/')
    ) {
      return src;
    }
    return '';
  }
}
