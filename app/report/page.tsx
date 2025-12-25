'use client';

import { useState, useCallback } from 'react';
import { VulnSource, DateRange, ReportType } from '@/lib/types';
import ReportOptions from '@/components/report/ReportOptions';
import ReportViewer from '@/components/report/ReportViewer';

export default function ReportPage() {
  const [sources, setSources] = useState<VulnSource[]>(['nvd', 'cisa']);
  const [dateRange, setDateRange] = useState<DateRange>('24h');
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        }),
      });

      if (!response.ok) {
        throw new Error('보고서 생성에 실패했습니다');
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
            } catch {
              // JSON 파싱 실패 무시
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }, [sources, dateRange, reportType]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-star">AI 보고서 생성</h1>
        <p className="mt-2 text-text-secondary">
          Claude AI가 취약점 데이터를 분석하여 한국어 보고서를 생성합니다
        </p>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="mb-6 rounded-lg border border-severity-critical/50 bg-severity-critical/10 p-4 text-severity-critical">
          <p>{error}</p>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* 옵션 패널 */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ReportOptions
            sources={sources}
            dateRange={dateRange}
            reportType={reportType}
            onSourcesChange={setSources}
            onDateRangeChange={setDateRange}
            onReportTypeChange={setReportType}
            onGenerate={handleGenerate}
            loading={loading}
          />
        </div>

        {/* 보고서 뷰어 */}
        <div>
          <ReportViewer markdown={markdown} loading={loading} />
        </div>
      </div>
    </div>
  );
}
