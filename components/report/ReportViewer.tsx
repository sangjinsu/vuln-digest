'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Sparkles } from 'lucide-react';
import CopyButton from './CopyButton';

interface ReportViewerProps {
  markdown: string;
  loading: boolean;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-text-muted">
      <FileText className="h-16 w-16 mb-4 opacity-50" />
      <p className="text-lg">보고서가 없습니다</p>
      <p className="text-sm mt-1">옵션을 선택하고 보고서를 생성해주세요</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Sparkles className="h-16 w-16 text-star-purple animate-pulse mb-4" />
      <p className="text-lg text-star">AI가 보고서를 작성하고 있습니다...</p>
      <p className="text-sm text-text-muted mt-1">잠시만 기다려주세요</p>
    </div>
  );
}

export default function ReportViewer({ markdown, loading }: ReportViewerProps) {
  if (loading && !markdown) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-card p-6">
        <LoadingState />
      </div>
    );
  }

  if (!markdown && !loading) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-card p-6">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-default bg-bg-card">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-border-default p-4">
        <h2 className="text-lg font-semibold text-star flex items-center gap-2">
          <FileText className="h-5 w-5" />
          생성된 보고서
          {loading && (
            <Sparkles className="h-4 w-4 text-star-purple animate-pulse" />
          )}
        </h2>
        <CopyButton text={markdown} />
      </div>

      {/* 마크다운 컨텐츠 */}
      <div className="p-6 prose prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold text-star mb-4 pb-2 border-b border-border-default">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-semibold text-star mt-6 mb-3">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-medium text-star-blue mt-4 mb-2">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-text-secondary mb-3 leading-relaxed">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside text-text-secondary mb-3 space-y-1">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside text-text-secondary mb-3 space-y-1">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-text-secondary">{children}</li>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-star-blue hover:text-star-cyan underline"
              >
                {children}
              </a>
            ),
            code: ({ children }) => (
              <code className="bg-bg-secondary px-1.5 py-0.5 rounded text-star-cyan text-sm font-mono">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="bg-bg-secondary p-4 rounded-lg overflow-x-auto mb-3">
                {children}
              </pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-star-purple pl-4 italic text-text-muted my-3">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto mb-3">
                <table className="min-w-full divide-y divide-border-default">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="px-4 py-2 text-left text-sm font-medium text-star bg-bg-secondary">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2 text-sm text-text-secondary border-t border-border-default">
                {children}
              </td>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-star">{children}</strong>
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
