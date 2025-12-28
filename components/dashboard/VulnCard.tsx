'use client';

import { ExternalLink } from 'lucide-react';
import { Vulnerability, SEVERITY_COLORS, SOURCE_INFO } from '@/lib/types';
import { highlightText } from '@/lib/utils/keywords';

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
  } = vulnerability;

  // 검색어 하이라이트 적용
  const highlightedTitle = searchQuery ? highlightText(title, searchQuery) : title;
  const highlightedDescription = searchQuery ? highlightText(description, searchQuery) : description;

  const severityLabel = severity.charAt(0).toUpperCase() + severity.slice(1);
  const sourceInfo = SOURCE_INFO[source];

  return (
    <div
      className="
        rounded-lg border border-border-default bg-bg-card p-4
        transition-all duration-200 ease-out
        hover:scale-[1.01] hover:border-star-purple/50
        hover:shadow-lg hover:shadow-star-purple/10
        hover:bg-bg-card/90
      "
    >
      {/* 헤더 - 간소화 */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* CVE ID */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm font-semibold text-star-blue hover:text-star-cyan transition-colors flex items-center gap-1 group"
          >
            {id}
            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>

          {/* Severity 배지 (unknown은 숨김) */}
          {severity !== 'unknown' && (
            <span
              className={`
                rounded-full px-2 py-0.5 text-xs font-semibold
                ${SEVERITY_COLORS[severity]} text-white
              `}
            >
              {severityLabel}
              {cvssScore != null && ` ${cvssScore.toFixed(1)}`}
            </span>
          )}
        </div>

        {/* 소스 + 날짜 통합 */}
        <span className="text-xs text-text-muted whitespace-nowrap flex-shrink-0">
          {sourceInfo.name} · {new Date(publishedAt).toLocaleDateString('ko-KR')}
        </span>
      </div>

      {/* 제목 - 1줄 */}
      <h3 className="text-sm font-medium text-star mb-1.5 line-clamp-1">
        {highlightedTitle}
      </h3>

      {/* 설명 - 2줄 */}
      <p className="text-xs text-text-secondary line-clamp-2">
        {highlightedDescription}
      </p>

      {/* 영향받는 제품 - 최대 3개 */}
      {affectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {affectedProducts.slice(0, 3).map((product, index) => (
            <span
              key={`${product}-${index}`}
              className="rounded bg-bg-secondary px-1.5 py-0.5 text-xs text-text-muted font-mono"
            >
              {product}
            </span>
          ))}
          {affectedProducts.length > 3 && (
            <span className="text-xs text-text-muted">
              +{affectedProducts.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
