'use client';

import { useState, useRef, useEffect } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { VulnSource, Severity, SOURCE_INFO, SEVERITY_COLORS } from '@/lib/types';

type SourceFilter = VulnSource | 'all';

interface FilterPanelProps {
  sourceFilter: SourceFilter;
  severityFilter: Severity[];
  sourceCounts?: Record<VulnSource, number>;
  onSourceChange: (source: SourceFilter) => void;
  onSeverityChange: (severities: Severity[]) => void;
}

const SOURCES: SourceFilter[] = ['all', 'github', 'kisa', 'nvd'];
const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low'];

const SOURCE_LABELS: Record<SourceFilter, string> = {
  all: '전체',
  github: 'GitHub',
  kisa: 'KISA',
  nvd: 'NVD',
};

export default function FilterPanel({
  sourceFilter,
  severityFilter,
  sourceCounts,
  onSourceChange,
  onSeverityChange,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeCount = (sourceFilter !== 'all' ? 1 : 0) + severityFilter.length;

  const handleSeverityToggle = (severity: Severity) => {
    if (severityFilter.includes(severity)) {
      onSeverityChange(severityFilter.filter((s) => s !== severity));
    } else {
      onSeverityChange([...severityFilter, severity]);
    }
  };

  const handleReset = () => {
    onSourceChange('all');
    onSeverityChange([]);
    setIsOpen(false);
  };

  const totalCount = sourceCounts
    ? Object.values(sourceCounts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div ref={panelRef} className="relative">
      {/* 토글 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 active:scale-95
          ${
            isOpen
              ? 'bg-star-purple/20 border-star-purple text-star'
              : 'bg-bg-card border-border-default text-text-secondary hover:border-border-hover hover:text-star'
          }
        `}
      >
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">필터</span>
        {activeCount > 0 && (
          <span className="bg-star-purple text-white text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
            {activeCount}
          </span>
        )}
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* 드롭다운 패널 */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-bg-card border border-border-default rounded-lg shadow-xl z-20 animate-scale-in">
          <div className="p-4 space-y-4">
            {/* 소스 필터 */}
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wide mb-2 block font-medium">
                소스
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SOURCES.map((source) => {
                  const isSelected = sourceFilter === source;
                  const count =
                    source === 'all'
                      ? totalCount
                      : sourceCounts?.[source] ?? 0;

                  return (
                    <button
                      key={source}
                      onClick={() => onSourceChange(source)}
                      className={`
                        px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 active:scale-95
                        ${
                          isSelected
                            ? 'bg-star-purple text-white shadow-sm shadow-star-purple/30'
                            : 'bg-bg-secondary text-text-secondary hover:text-star hover:bg-bg-secondary/80'
                        }
                      `}
                    >
                      {SOURCE_LABELS[source]}{' '}
                      <span className="opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 심각도 필터 */}
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wide mb-2 block font-medium">
                심각도
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SEVERITIES.map((severity) => {
                  const isSelected = severityFilter.includes(severity);
                  return (
                    <button
                      key={severity}
                      onClick={() => handleSeverityToggle(severity)}
                      className={`
                        flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium
                        transition-all duration-200 border active:scale-95
                        ${
                          isSelected
                            ? `${SEVERITY_COLORS[severity]} text-white border-transparent shadow-sm`
                            : 'bg-bg-secondary text-text-secondary border-border-default hover:border-border-hover'
                        }
                      `}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isSelected ? 'bg-white' : SEVERITY_COLORS[severity]
                        }`}
                      />
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 초기화 버튼 */}
            {activeCount > 0 && (
              <button
                onClick={handleReset}
                className="w-full py-2 text-xs text-text-muted hover:text-star transition-colors flex items-center justify-center gap-1 border-t border-border-default pt-3 mt-3"
              >
                <X className="h-3 w-3" />
                필터 초기화
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
