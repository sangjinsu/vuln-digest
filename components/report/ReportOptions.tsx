'use client';

import { FileText, Sparkles } from 'lucide-react';
import { VulnSource, DateRange, ReportType, SOURCE_INFO } from '@/lib/types';

interface ReportOptionsProps {
  sources: VulnSource[];
  dateRange: DateRange;
  reportType: ReportType;
  onSourcesChange: (sources: VulnSource[]) => void;
  onDateRangeChange: (range: DateRange) => void;
  onReportTypeChange: (type: ReportType) => void;
  onGenerate: () => void;
  loading: boolean;
}

const AVAILABLE_SOURCES: VulnSource[] = ['nvd', 'cisa'];

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: '24h', label: '24시간' },
  { value: 'week', label: '1주일' },
  { value: 'month', label: '1개월' },
];

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  { value: 'summary', label: '요약', description: '핵심 내용만 간결하게' },
  { value: 'detailed', label: '상세', description: '전체 분석 및 권장사항' },
];

export default function ReportOptions({
  sources,
  dateRange,
  reportType,
  onSourcesChange,
  onDateRangeChange,
  onReportTypeChange,
  onGenerate,
  loading,
}: ReportOptionsProps) {
  const handleSourceToggle = (source: VulnSource) => {
    if (sources.includes(source)) {
      if (sources.length > 1) {
        onSourcesChange(sources.filter((s) => s !== source));
      }
    } else {
      onSourcesChange([...sources, source]);
    }
  };

  return (
    <div className="rounded-lg border border-border-default bg-bg-card p-6">
      <h2 className="text-lg font-semibold text-star mb-6">보고서 옵션</h2>

      {/* 데이터 소스 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-secondary mb-3">
          데이터 소스
        </label>
        <div className="space-y-2">
          {AVAILABLE_SOURCES.map((source) => (
            <label
              key={source}
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={sources.includes(source)}
                onChange={() => handleSourceToggle(source)}
                className="h-4 w-4 rounded border-border-default bg-bg-secondary text-star-purple focus:ring-star-purple"
              />
              <span className="text-sm text-star">{SOURCE_INFO[source].name}</span>
              <span className="text-xs text-text-muted">
                {SOURCE_INFO[source].description}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 기간 선택 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-secondary mb-3">
          분석 기간
        </label>
        <div className="flex gap-2">
          {DATE_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => onDateRangeChange(range.value)}
              className={`
                flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                ${
                  dateRange === range.value
                    ? 'bg-star-purple text-white'
                    : 'bg-bg-secondary text-text-secondary hover:text-star'
                }
              `}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* 보고서 형식 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-secondary mb-3">
          보고서 형식
        </label>
        <div className="space-y-2">
          {REPORT_TYPES.map((type) => (
            <label
              key={type.value}
              className={`
                flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                ${
                  reportType === type.value
                    ? 'bg-star-purple/20 border border-star-purple'
                    : 'bg-bg-secondary border border-transparent hover:border-border-hover'
                }
              `}
            >
              <input
                type="radio"
                name="reportType"
                value={type.value}
                checked={reportType === type.value}
                onChange={() => onReportTypeChange(type.value)}
                className="h-4 w-4 text-star-purple focus:ring-star-purple"
              />
              <div>
                <span className="text-sm font-medium text-star">{type.label}</span>
                <p className="text-xs text-text-muted">{type.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 생성 버튼 */}
      <button
        onClick={onGenerate}
        disabled={loading || sources.length === 0}
        className={`
          w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-colors
          ${
            loading || sources.length === 0
              ? 'bg-bg-secondary text-text-muted cursor-not-allowed'
              : 'bg-gradient-to-r from-star-purple to-star-blue text-white hover:opacity-90'
          }
        `}
      >
        {loading ? (
          <>
            <Sparkles className="h-5 w-5 animate-pulse" />
            생성 중...
          </>
        ) : (
          <>
            <FileText className="h-5 w-5" />
            보고서 생성
          </>
        )}
      </button>
    </div>
  );
}
