'use client';

import { ExternalLink } from 'lucide-react';
import { Vulnerability, SEVERITY_COLORS, SEVERITY_TEXT_COLORS, SOURCE_INFO } from '@/lib/types';
import { highlightText, extractKeywordsFromVuln } from '@/lib/utils/keywords';

interface VulnCardProps {
  vulnerability: Vulnerability;
  searchQuery?: string;
}

export default function VulnCard({ vulnerability, searchQuery }: VulnCardProps) {
  const {
    id,
    source,
    severity,
    cvssScore,
    title,
    description,
    affectedProducts,
    publishedAt,
    url,
    _fallback,
  } = vulnerability;

  // 검색어 하이라이트 적용
  const highlightedTitle = searchQuery ? highlightText(title, searchQuery) : title;
  const highlightedDescription = searchQuery ? highlightText(description, searchQuery) : description;

  // 키워드 추출
  const keywords = extractKeywordsFromVuln({ title, description });

  const severityLabel = severity.charAt(0).toUpperCase() + severity.slice(1);
  const sourceInfo = SOURCE_INFO[source];

  return (
    <div className="rounded-lg border border-border-default bg-bg-card p-4 hover:border-border-hover transition-colors">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* CVE ID */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm font-semibold text-star-blue hover:text-star-cyan transition-colors flex items-center gap-1"
          >
            {id}
            <ExternalLink className="h-3 w-3" />
          </a>

          {/* Severity 배지 (unknown은 숨김) */}
          {severity !== 'unknown' && (
            <span
              className={`
                rounded-full px-3 py-1 text-xs font-semibold
                ${SEVERITY_COLORS[severity]} text-white
              `}
            >
              {severityLabel}
              {cvssScore != null && ` ${cvssScore.toFixed(1)}`}
            </span>
          )}

          {/* 소스 배지 */}
          <span className="rounded-full bg-bg-secondary px-2 py-0.5 text-xs text-text-muted">
            {sourceInfo.name}
          </span>

          {/* Fallback 라벨 (CISA 24시간 내 데이터 없을 때) */}
          {_fallback && (
            <span className="rounded-full bg-severity-medium/20 px-2 py-0.5 text-xs text-severity-medium">
              최근 추가
            </span>
          )}
        </div>

        {/* 날짜 */}
        <span className="text-xs text-text-muted whitespace-nowrap">
          {new Date(publishedAt).toLocaleDateString('ko-KR')}
        </span>
      </div>

      {/* 제목 */}
      <h3 className="text-sm font-medium text-star mb-2 line-clamp-2">
        {highlightedTitle}
      </h3>

      {/* 설명 */}
      <p className="text-xs text-text-secondary mb-3 line-clamp-3">
        {highlightedDescription}
      </p>

      {/* 영향받는 제품 */}
      {affectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {affectedProducts.slice(0, 5).map((product, index) => (
            <span
              key={`${product}-${index}`}
              className="rounded bg-bg-secondary px-2 py-0.5 text-xs text-text-muted font-mono"
            >
              {product}
            </span>
          ))}
          {affectedProducts.length > 5 && (
            <span className="text-xs text-text-muted">
              +{affectedProducts.length - 5}개
            </span>
          )}
        </div>
      )}

      {/* 키워드 태그 */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {keywords.map((keyword, idx) => (
            <span
              key={idx}
              className="rounded bg-star-purple/20 px-2 py-0.5 text-xs text-star-purple"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
