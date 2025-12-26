'use client';

import { useState } from 'react';
import { FileText, Sparkles, Eye, EyeOff } from 'lucide-react';
import { VulnSource, DateRange, ReportType, SOURCE_INFO } from '@/lib/types';
import { LLMProvider, LLM_PROVIDERS } from '@/lib/llm';

interface ReportOptionsProps {
  sources: VulnSource[];
  dateRange: DateRange;
  reportType: ReportType;
  llmProvider: LLMProvider;
  apiKey: string;
  onSourcesChange: (sources: VulnSource[]) => void;
  onDateRangeChange: (range: DateRange) => void;
  onReportTypeChange: (type: ReportType) => void;
  onLLMProviderChange: (provider: LLMProvider) => void;
  onApiKeyChange: (key: string) => void;
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
  llmProvider,
  apiKey,
  onSourcesChange,
  onDateRangeChange,
  onReportTypeChange,
  onLLMProviderChange,
  onApiKeyChange,
  onGenerate,
  loading,
}: ReportOptionsProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSourceToggle = (source: VulnSource) => {
    if (sources.includes(source)) {
      if (sources.length > 1) {
        onSourcesChange(sources.filter((s) => s !== source));
      }
    } else {
      onSourcesChange([...sources, source]);
    }
  };

  const isGenerateDisabled = loading || sources.length === 0 || !apiKey.trim();

  return (
    <div className="rounded-lg border border-border-default bg-bg-card p-6">
      <h2 className="text-lg font-semibold text-star mb-6">보고서 옵션</h2>

      {/* AI 모델 선택 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-secondary mb-3">
          AI 모델
        </label>
        <div className="space-y-2">
          {Object.values(LLM_PROVIDERS).map((provider) => (
            <label
              key={provider.id}
              className={`
                flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                ${
                  llmProvider === provider.id
                    ? 'bg-star-purple/20 border border-star-purple'
                    : 'bg-bg-secondary border border-transparent hover:border-border-hover'
                }
              `}
            >
              <input
                type="radio"
                name="llmProvider"
                value={provider.id}
                checked={llmProvider === provider.id}
                onChange={() => onLLMProviderChange(provider.id)}
                className="h-4 w-4 text-star-purple focus:ring-star-purple"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-star">{provider.name}</span>
                <p className="text-xs text-text-muted">{provider.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* API 키 입력 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-secondary mb-3">
          API 키
        </label>
        <div className="relative">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder={LLM_PROVIDERS[llmProvider].keyPlaceholder}
            className="w-full rounded-lg border border-border-default bg-bg-secondary
                       px-4 py-2.5 pr-12 text-sm text-star placeholder:text-text-muted
                       focus:border-star-purple focus:outline-none focus:ring-1 focus:ring-star-purple"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-star transition-colors"
          >
            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          API 키는 서버에 저장되지 않습니다
        </p>
      </div>

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
        disabled={isGenerateDisabled}
        className={`
          w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-colors
          ${
            isGenerateDisabled
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

      {!apiKey.trim() && !loading && (
        <p className="mt-2 text-xs text-center text-severity-medium">
          API 키를 입력해주세요
        </p>
      )}
    </div>
  );
}
