'use client';

import { ReactNode, createElement } from 'react';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 제외할 일반 단어
const EXCLUDE_WORDS = [
  'The', 'This', 'That', 'For', 'And', 'With', 'From', 'Into',
  'When', 'Where', 'Which', 'What', 'How', 'Why', 'Are', 'Was',
  'Has', 'Have', 'Had', 'Can', 'Could', 'Would', 'Should', 'May',
  'Might', 'Must', 'Will', 'Shall', 'Not', 'All', 'Any', 'Some',
  'None', 'Each', 'Every', 'Both', 'Few', 'Many', 'Most', 'Other',
];

/**
 * 텍스트에서 키워드 추출 (정규식 기반)
 * - CVE ID 추출
 * - 제품명 추출 (대문자로 시작하는 영어 단어)
 * - 하이픈 연결 용어 (use-after-free)
 */
function extractKeywordsFromText(text: string): string[] {
  const keywords: string[] = [];

  // 1. CVE ID 추출
  const cveIds = text.match(/CVE-\d{4}-\d+/gi) || [];
  keywords.push(...cveIds.map(id => id.toUpperCase()));

  // 2. 대문자로 시작하는 영어 단어 (제품명)
  const productNames = text.match(/\b[A-Z][a-zA-Z0-9]{2,}\b/g) || [];
  keywords.push(
    ...productNames.filter(
      p => !p.startsWith('CVE') && !EXCLUDE_WORDS.includes(p)
    )
  );

  // 3. 하이픈 연결 용어 (use-after-free, out-of-bounds)
  const hyphenated = text.match(/[a-zA-Z]+-[a-zA-Z0-9-]+/g) || [];
  keywords.push(...hyphenated.filter(h => !h.match(/^\d/) && !h.startsWith('CVE')));

  return [...new Set(keywords)].slice(0, 15);
}

/**
 * 개별 취약점에서 키워드 추출
 */
export function extractKeywordsFromVuln(
  vuln: { title: string; description: string }
): string[] {
  const text = `${vuln.title} ${vuln.description}`;
  return extractKeywordsFromText(text).slice(0, 5);
}

/**
 * 검색어 자동완성용 키워드 추출
 */
export function extractSearchSuggestions(
  vulns: { id: string; title: string; description: string; affectedProducts: string[] }[]
): string[] {
  const ids = vulns.map(v => v.id).slice(0, 5);
  const products = [...new Set(vulns.flatMap(v => v.affectedProducts))].slice(0, 5);
  const allTitles = vulns.map(v => v.title).join(' ');
  const extracted = extractKeywordsFromText(allTitles).slice(0, 5);

  return [...new Set([...ids, ...products, ...extracted])];
}

/**
 * 텍스트 하이라이트 (검색 결과용)
 * XSS 방지: React 컴포넌트 배열 반환
 */
export function highlightText(text: string, query: string): ReactNode[] {
  if (!query.trim()) return [text];

  const escapedQuery = escapeRegex(query);
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? createElement('mark', {
          key: i,
          className: 'bg-star-purple/30 text-star rounded px-0.5'
        }, part)
      : part
  );
}
