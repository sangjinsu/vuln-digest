'use client';

import { useState, useCallback } from 'react';
import { VulnSource, VulnResponse, DateRange, ReportType } from '@/lib/types';
import { LLMProvider, LLM_PROVIDERS } from '@/lib/llm';
import ReportOptions from '@/components/report/ReportOptions';
import ReportViewer from '@/components/report/ReportViewer';
import ConfirmModal from '@/components/report/ConfirmModal';

export default function ReportPage() {
  const [sources, setSources] = useState<VulnSource[]>(['nvd', 'kisa']);
  const [dateRange, setDateRange] = useState<DateRange>('24h');
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [llmProvider, setLLMProvider] = useState<LLMProvider>('claude');
  const [model, setModel] = useState<string>(LLM_PROVIDERS.claude.defaultModel);
  const [apiKey, setApiKey] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 확인 모달 상태
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<VulnResponse['meta'] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // 생성 버튼 클릭 → 데이터 조회 → 모달 표시
  const handlePreGenerate = useCallback(async () => {
    if (!apiKey.trim()) {
      setError('API 키를 입력해주세요');
      return;
    }

    setError(null);
    setPreviewLoading(true);
    setConfirmModalOpen(true);

    try {
      const params = new URLSearchParams({
        sources: sources.join(','),
        dateRange,
        limit: '50',
      });

      const response = await fetch(`/api/vulnerabilities?${params}`);
      if (!response.ok) {
        throw new Error('취약점 조회에 실패했습니다');
      }

      const data: VulnResponse = await response.json();
      setPreviewData(data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setConfirmModalOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  }, [sources, dateRange, apiKey]);

  // 모달에서 확인 → 실제 보고서 생성
  const handleConfirmGenerate = useCallback(() => {
    setConfirmModalOpen(false);
    handleGenerate();
  }, []);

  // 모달 취소
  const handleCancelModal = useCallback(() => {
    if (!previewLoading) {
      setConfirmModalOpen(false);
      setPreviewData(null);
    }
  }, [previewLoading]);

  // 실제 보고서 생성
  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMarkdown('');

    try {
      const response = await fetch('/api/report/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sources,
          dateRange,
          reportType,
          llm: {
            provider: llmProvider,
            model,
            apiKey,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '보고서 생성에 실패했습니다');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('스트림을 읽을 수 없습니다');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setMarkdown((prev) => prev + parsed.content);
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              if (e instanceof SyntaxError) {
                // JSON 파싱 실패 무시
              } else {
                throw e;
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }, [sources, dateRange, reportType, llmProvider, model, apiKey]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      {/* 페이지 헤더 */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-star">AI 보고서 생성</h1>
        <p className="mt-1 text-sm text-text-secondary">
          AI가 취약점 데이터를 분석하여 한국어 보고서를 생성합니다
        </p>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="mb-4 rounded-lg border border-severity-critical/50 bg-severity-critical/10 px-3 py-2 text-sm text-severity-critical animate-fade-in-up">
          <p>{error}</p>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* 옵션 패널 */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ReportOptions
            sources={sources}
            dateRange={dateRange}
            reportType={reportType}
            llmProvider={llmProvider}
            model={model}
            apiKey={apiKey}
            onSourcesChange={setSources}
            onDateRangeChange={setDateRange}
            onReportTypeChange={setReportType}
            onLLMProviderChange={setLLMProvider}
            onModelChange={setModel}
            onApiKeyChange={setApiKey}
            onGenerate={handlePreGenerate}
            loading={loading || previewLoading}
          />
        </div>

        {/* 보고서 뷰어 */}
        <div>
          <ReportViewer markdown={markdown} loading={loading} />
        </div>
      </div>

      {/* 확인 모달 */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onConfirm={handleConfirmGenerate}
        onCancel={handleCancelModal}
        loading={previewLoading}
        data={previewData}
      />
    </div>
  );
}
