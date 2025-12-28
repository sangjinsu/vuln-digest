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
    <div className="flex flex-col items-center justify-center py-12 text-text-muted animate-fade-in-up">
      <FileText className="h-12 w-12 mb-3 opacity-50" />
      <p className="text-base">보고서가 없습니다</p>
      <p className="text-sm mt-1 opacity-70">옵션을 선택하고 보고서를 생성해주세요</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in-up">
      <Sparkles className="h-12 w-12 text-star-purple animate-pulse mb-3" />
      <p className="text-base text-star">AI가 보고서를 작성하고 있습니다...</p>
      <p className="text-sm text-text-muted mt-1">잠시만 기다려주세요</p>
    </div>
  );
}

function TypingCursor() {
  return (
    <span className="inline-block text-star-purple animate-blink ml-0.5">▌</span>
  );
}

export default function ReportViewer({ markdown, loading }: ReportViewerProps) {
  if (loading && !markdown) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-card p-4">
        <LoadingState />
      </div>
    );
  }

  if (!markdown && !loading) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-card p-4">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-default bg-bg-card animate-fade-in-up">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <h2 className="text-base font-semibold text-star flex items-center gap-2">
          <FileText className="h-4 w-4" />
          생성된 보고서
          {loading && (
            <Sparkles className="h-3.5 w-3.5 text-star-purple animate-pulse" />
          )}
        </h2>
        <CopyButton text={markdown} />
      </div>

      {/* 마크다운 컨텐츠 */}
      <div className="p-4 prose prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-xl font-bold text-star mb-3 pb-2 border-b border-border-default">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold text-star mt-5 mb-2">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-medium text-star-blue mt-3 mb-1.5">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-text-secondary mb-2.5 leading-relaxed text-sm">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside text-text-secondary mb-2.5 space-y-0.5 text-sm">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside text-text-secondary mb-2.5 space-y-0.5 text-sm">
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
                className="text-star-blue hover:text-star-cyan underline transition-colors"
              >
                {children}
              </a>
            ),
            code: ({ children }) => (
              <code className="bg-bg-secondary px-1 py-0.5 rounded text-star-cyan text-xs font-mono">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="bg-bg-secondary p-3 rounded-lg overflow-x-auto mb-2.5 text-sm">
                {children}
              </pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-star-purple pl-3 italic text-text-muted my-2.5 text-sm">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto mb-2.5">
                <table className="min-w-full divide-y divide-border-default text-sm">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="px-3 py-1.5 text-left text-xs font-medium text-star bg-bg-secondary">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-3 py-1.5 text-sm text-text-secondary border-t border-border-default">
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
        {loading && <TypingCursor />}
      </div>
    </div>
  );
}
