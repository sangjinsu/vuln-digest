import { DateRange } from '../types';

/**
 * DateRange를 시작 날짜 ISO 문자열로 변환
 */
export function dateRangeToStartDate(range: DateRange): string {
  const now = new Date();
  let startDate: Date;

  switch (range) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  return startDate.toISOString();
}

/**
 * 현재 날짜를 ISO 문자열로 반환
 */
export function formatDateISO(date: Date): string {
  return date.toISOString();
}

/**
 * YYYY-MM-DD 형식 문자열을 Date로 파싱 (CISA KEV 날짜 형식)
 */
export function parseYYYYMMDD(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00.000Z');
}
