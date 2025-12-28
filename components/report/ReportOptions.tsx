'use client';

import { useState } from 'react';
import { FileText, Sparkles, Eye, EyeOff, ChevronDown, Settings } from 'lucide-react';
import { VulnSource, DateRange, ReportType, SOURCE_INFO } from '@/lib/types';
import { LLMProvider, LLM_PROVIDERS, LLM_MODELS } from '@/lib/llm';

interface ReportOptionsProps {
  sources: VulnSource[];
  dateRange: DateRange;
  reportType: ReportType;
  llmProvider: LLMProvider;
  model: string;
  apiKey: string;
  onSourcesChange: (sources: VulnSource[]) => void;
  onDateRangeChange: (range: DateRange) => void;
  onReportTypeChange: (type: ReportType) => void;
  onLLMProviderChange: (provider: LLMProvider) => void;
  onModelChange: (model: string) => void;
  onApiKeyChange: (key: string) => void;
  onGenerate: () => void;
  loading: boolean;
}

const AVAILABLE_SOURCES: VulnSource[] = ['github', 'kisa', 'nvd'];

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: '24h', label: '24시간' },
  { value: 'week', label: '1주일' },
  { value: 'month', label: '1개월' },
];

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'summary', label: '요약' },
  { value: 'detailed', label: '상세' },
];

export default function ReportOptions({
  sources,
  dateRange,
  reportType,
  llmProvider,
  model,
  apiKey,
  onSourcesChange,
  onDateRangeChange,
  onReportTypeChange,
  onLLMProviderChange,
  onModelChange,
  onApiKeyChange,
  onGenerate,
  loading,
}: ReportOptionsProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const availableModels = LLM_MODELS[llmProvider];

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
    <div className="rounded-lg border border-border-default bg-bg-card p-4">
      {/* Provider 탭 */}
      <div className="flex rounded-lg bg-bg-secondary p-1 mb-4">
        {Object.values(LLM_PROVIDERS).map((provider) => (
          <button
            key={provider.id}
            onClick={() => {
              onLLMProviderChange(provider.id);
              onModelChange(provider.defaultModel);
            }}
            className={`
              flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-95
              ${
                llmProvider === provider.id
                  ? 'bg-star-purple text-white shadow-sm shadow-star-purple/30'
                  : 'text-text-secondary hover:text-star hover:bg-bg-card/50'
              }
            `}
          >
            {provider.name}
          </button>
        ))}
      </div>

      {/* 모델 선택 */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-text-muted mb-1.5">
          모델
        </label>
        <select
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          className="w-full rounded-lg border border-border-default bg-bg-secondary
                     px-3 py-2 text-sm text-star
                     focus:border-star-purple focus:outline-none transition-colors"
        >
          {availableModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} - {m.description}
            </option>
          ))}
        </select>
      </div>

      {/* 보고서 형식 */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-text-muted mb-1.5">
          형식
        </label>
        <div className="flex rounded-lg bg-bg-secondary p-1">
          {REPORT_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => onReportTypeChange(type.value)}
              className={`
                flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 active:scale-95
                ${
                  reportType === type.value
                    ? 'bg-bg-card text-star shadow-sm'
                    : 'text-text-secondary hover:text-star'
                }
              `}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* 고급 설정 아코디언 */}
      <div className="mb-4 border-t border-border-default pt-4">
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="flex items-center justify-between w-full text-sm font-medium text-text-secondary hover:text-star transition-colors"
        >
          <span className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            고급 설정
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              advancedOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {advancedOpen && (
          <div className="mt-3 space-y-4 animate-slide-down">
            {/* API 키 입력 */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                API 키
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => onApiKeyChange(e.target.value)}
                  placeholder={LLM_PROVIDERS[llmProvider].keyPlaceholder}
                  className="w-full rounded-lg border border-border-default bg-bg-secondary
                             px-3 py-2 pr-10 text-sm text-star placeholder:text-text-muted
                             focus:border-star-purple focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-star transition-colors"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* 데이터 소스 */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                데이터 소스
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SOURCES.map((source) => (
                  <label
                    key={source}
                    className={`
                      flex items-center gap-1.5 px-2.5 py-1.5 rounded-md cursor-pointer text-sm transition-all
                      ${
                        sources.includes(source)
                          ? 'bg-star-purple/20 text-star border border-star-purple/50'
                          : 'bg-bg-secondary text-text-secondary border border-transparent hover:border-border-hover'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={sources.includes(source)}
                      onChange={() => handleSourceToggle(source)}
                      className="sr-only"
                    />
                    {SOURCE_INFO[source].name}
                  </label>
                ))}
              </div>
            </div>

            {/* 기간 선택 */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                분석 기간
              </label>
              <div className="flex gap-1.5">
                {DATE_RANGES.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => onDateRangeChange(range.value)}
                    className={`
                      flex-1 rounded-md px-2.5 py-1.5 text-sm font-medium transition-all active:scale-95
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
          </div>
        )}
      </div>

      {/* 생성 버튼 */}
      <button
        onClick={onGenerate}
        disabled={isGenerateDisabled}
        className={`
          w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium
          transition-all duration-200 active:scale-[0.98]
          ${
            isGenerateDisabled
              ? 'bg-bg-secondary text-text-muted cursor-not-allowed'
              : 'bg-gradient-to-r from-star-purple to-star-blue text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-star-purple/25'
          }
        `}
      >
        {loading ? (
          <>
            <Sparkles className="h-4 w-4 animate-pulse" />
            생성 중...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
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
