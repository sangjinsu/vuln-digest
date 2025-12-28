'use client';

import { useEffect } from 'react';
import { X, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { VulnSource, SOURCE_INFO } from '@/lib/types';

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  data: {
    total: number;
    sources: Record<VulnSource, number>;
  } | null;
}

const SOURCE_COLORS: Record<VulnSource, string> = {
  github: 'bg-star-purple',
  kisa: 'bg-star-cyan',
  nvd: 'bg-star-blue',
};

export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  loading,
  data,
}: ConfirmModalProps) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onCancel]);

  // 배경 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isEmpty = !data || data.total === 0;
  const maxCount = data ? Math.max(...Object.values(data.sources), 1) : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in-up"
        onClick={loading ? undefined : onCancel}
      />

      {/* 모달 */}
      <div className="relative z-10 w-full max-w-sm mx-4 rounded-lg border border-border-default bg-bg-card shadow-2xl animate-scale-in">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
          <h3 className="text-base font-semibold text-star flex items-center gap-2">
            {isEmpty ? (
              <>
                <AlertTriangle className="h-4 w-4 text-severity-medium" />
                취약점 없음
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                보고서 생성 확인
              </>
            )}
          </h3>
          {!loading && (
            <button
              onClick={onCancel}
              className="text-text-muted hover:text-star transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 본문 */}
        <div className="p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-8 w-8 text-star-purple animate-spin mb-3" />
              <p className="text-sm text-text-secondary">취약점 조회 중...</p>
            </div>
          ) : isEmpty ? (
            <div className="text-center py-4">
              <p className="text-text-secondary text-sm mb-2">
                선택한 기간과 소스에서
              </p>
              <p className="text-text-secondary text-sm">
                취약점을 찾을 수 없습니다.
              </p>
              <p className="text-text-muted text-xs mt-3">
                다른 옵션을 선택해주세요.
              </p>
            </div>
          ) : (
            <>
              {/* 총 개수 */}
              <div className="text-center mb-4">
                <p className="text-text-secondary text-sm">분석할 취약점</p>
                <p className="text-2xl font-bold text-star mt-1">
                  {data.total}
                  <span className="text-base font-normal text-text-muted ml-1">개</span>
                </p>
              </div>

              {/* 소스별 개수 */}
              <div className="space-y-2 mb-4">
                {(Object.entries(data.sources) as [VulnSource, number][])
                  .filter(([, count]) => count > 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([source, count]) => (
                    <div key={source} className="flex items-center gap-3">
                      <span className="text-xs text-text-secondary w-16 truncate">
                        {SOURCE_INFO[source].name}
                      </span>
                      <div className="flex-1 h-2 bg-bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full ${SOURCE_COLORS[source]} rounded-full transition-all duration-500`}
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-muted w-8 text-right">
                        {count}개
                      </span>
                    </div>
                  ))}
              </div>

              <p className="text-center text-text-muted text-xs">
                이 데이터로 보고서를 생성할까요?
              </p>
            </>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex gap-2 border-t border-border-default p-4">
          {isEmpty ? (
            <button
              onClick={onCancel}
              className="flex-1 rounded-lg bg-bg-secondary px-4 py-2 text-sm font-medium text-text-secondary hover:text-star transition-colors"
            >
              닫기
            </button>
          ) : (
            <>
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 rounded-lg bg-bg-secondary px-4 py-2 text-sm font-medium text-text-secondary hover:text-star transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 rounded-lg bg-gradient-to-r from-star-purple to-star-blue px-4 py-2 text-sm font-medium text-white hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                생성하기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
