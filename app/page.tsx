import { Shield, AlertTriangle, TrendingUp, Clock } from 'lucide-react';

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-star">보안 취약점 대시보드</h1>
        <p className="mt-2 text-text-secondary">
          최근 24시간 내 발견된 보안 취약점을 모니터링합니다
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border-default bg-bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-severity-critical/20 p-3">
              <AlertTriangle className="h-6 w-6 text-severity-critical" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Critical</p>
              <p className="text-2xl font-bold text-star">-</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border-default bg-bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-severity-high/20 p-3">
              <Shield className="h-6 w-6 text-severity-high" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">High</p>
              <p className="text-2xl font-bold text-star">-</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border-default bg-bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-star-blue/20 p-3">
              <TrendingUp className="h-6 w-6 text-star-blue" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">전체</p>
              <p className="text-2xl font-bold text-star">-</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border-default bg-bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-star-purple/20 p-3">
              <Clock className="h-6 w-6 text-star-purple" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">마지막 업데이트</p>
              <p className="text-lg font-medium text-star">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* 취약점 목록 영역 (Placeholder) */}
      <div className="rounded-lg border border-border-default bg-bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold text-star">최근 취약점</h2>
        <div className="flex flex-col items-center justify-center py-12 text-text-muted">
          <Shield className="h-12 w-12 mb-4 opacity-50" />
          <p>Phase 2에서 취약점 데이터가 표시됩니다</p>
          <p className="text-sm mt-1">API 연동 후 실시간 데이터 제공 예정</p>
        </div>
      </div>
    </div>
  );
}
