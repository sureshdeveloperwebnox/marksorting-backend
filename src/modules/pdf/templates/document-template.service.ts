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

  imageSrc(value: unknown): string {
    const src = this.escape(value);
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:image/')) {
      return src;
    }
    return '';
  }
}
