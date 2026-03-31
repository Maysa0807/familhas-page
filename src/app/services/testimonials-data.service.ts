import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of } from 'rxjs';

export type Testimonial = {
  author: string;
  role: string;
  text: string;
  createdAt?: Date;
};

@Injectable({
  providedIn: 'root'
})
export class TestimonialsDataService {
  private readonly blockedSnippets = ['quero agradecer de coracao ao eneas'];

  constructor(private readonly http: HttpClient) {}

  loadFromCsv(csvUrl: string): Observable<Testimonial[]> {
    if (!csvUrl?.trim()) {
      return of([]);
    }

    return this.http.get(csvUrl, { responseType: 'text' }).pipe(
      map((csv) => this.parseCsv(csv)),
      map((rows) => this.rowsToTestimonials(rows))
    );
  }

  private rowsToTestimonials(rows: string[][]): Testimonial[] {
    if (rows.length < 2) {
      return [];
    }

    const headers = rows[0].map((h) => this.normalize(h));
    const idx = {
      timestamp: this.findIndex(headers, ['carimbo de data/hora', 'timestamp']),
      name: this.findIndex(headers, ['nome']),
      destination: this.findIndex(headers, ['local de destino', 'destino']),
      authorize: this.findIndex(headers, ['voce autoriza o uso do seu feedback nas nossas redes sociais', 'autoriza o uso do seu feedback']),
      testimonial: this.findIndex(headers, ['deixe um breve depoimento sobre sua experiencia com a familhas', 'breve depoimento', 'depoimento'])
    };

    const dataRows = rows.slice(1);
    const mapped = dataRows
      .map((row) => {
        const rawText = this.at(row, idx.testimonial);
        const rawName = this.at(row, idx.name);
        const rawDestination = this.at(row, idx.destination);
        const rawAuthorize = this.at(row, idx.authorize);
        const rawTimestamp = this.at(row, idx.timestamp);

        const isAuthorized = this.normalize(rawAuthorize).startsWith('sim');
        const text = rawText.trim();
        const author = rawName.trim() || 'Cliente Familhas';
        const role = rawDestination.trim() ? `Destino: ${rawDestination.trim()}` : 'Cliente Familhas';
        const createdAt = this.parseDate(rawTimestamp);

        return { author, role, text, createdAt, isAuthorized };
      })
      .filter((item) => item.isAuthorized && !!item.text)
      .filter((item) => !this.isBlocked(item.text));

    return mapped
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, 6)
      .map(({ isAuthorized: _, ...testimonial }) => testimonial);
  }

  private parseDate(value: string): Date | undefined {
    if (!value?.trim()) {
      return undefined;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private findIndex(headers: string[], candidates: string[]): number {
    for (const c of candidates) {
      const normalized = this.normalize(c);
      const exact = headers.findIndex((h) => h === normalized);
      if (exact !== -1) {
        return exact;
      }

      const partial = headers.findIndex((h) => h.includes(normalized));
      if (partial !== -1) {
        return partial;
      }
    }
    return -1;
  }

  private at(row: string[], index: number): string {
    return index >= 0 && index < row.length ? row[index] : '';
  }

  private normalize(value: string): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private isBlocked(text: string): boolean {
    const normalizedText = this.normalize(text);
    return this.blockedSnippets.some((snippet) => normalizedText.includes(snippet));
  }

  private parseCsv(input: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let value = '';
    let inQuotes = false;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      const next = input[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          value += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === ',' && !inQuotes) {
        row.push(value);
        value = '';
        continue;
      }

      if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && next === '\n') {
          i++;
        }
        row.push(value);
        rows.push(row);
        row = [];
        value = '';
        continue;
      }

      value += char;
    }

    if (value.length > 0 || row.length > 0) {
      row.push(value);
      rows.push(row);
    }

    return rows;
  }
}
