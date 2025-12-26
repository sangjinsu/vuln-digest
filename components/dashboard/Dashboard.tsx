'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { VulnResponse, VulnSource, DateRange, Vulnerability, Severity } from '@/lib/types';
import StatsCards from './StatsCards';
import SourceTabs from './SourceTabs';
import DateRangePicker from './DateRangePicker';
import SeverityFilter from './SeverityFilter';
import SearchInput from './SearchInput';
import VulnList from './VulnList';

type SourceFilter = VulnSource | 'all';

export default function Dashboard() {
  const [data, setData] = useState<VulnResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('24h');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<Severity[]>([]);
  const [searchText, setSearchText] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/vulnerabilities?dateRange=${dateRange}`);
      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다');
      }
      const result: VulnResponse = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 필터링된 취약점 목록
  const filteredVulnerabilities: Vulnerability[] = useMemo(() => {
    if (!data?.data) return [];

    return data.data
      .filter((v) => sourceFilter === 'all' || v.source === sourceFilter)
      .filter((v) => severityFilter.length === 0 || severityFilter.includes(v.severity))
      .filter((v) => {
        if (!searchText) return true;
        const search = searchText.toLowerCase();
        return (
          v.id.toLowerCase().includes(search) ||
          v.title.toLowerCase().includes(search) ||
          v.description.toLowerCase().includes(search)
        );
      });
  }, [data?.data, sourceFilter, severityFilter, searchText]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 페이지 헤더 */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-star">보안 취약점 대시보드</h1>
          <p className="mt-2 text-text-secondary">
            최근 {dateRange === '24h' ? '24시간' : dateRange === 'week' ? '1주일' : '1개월'} 내 발견된 보안 취약점을 모니터링합니다
          </p>
        </div>
        <DateRangePicker selected={dateRange} onSelect={setDateRange} />
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="mb-8 rounded-lg border border-severity-critical/50 bg-severity-critical/10 p-4 text-severity-critical">
          <p>{error}</p>
          <button
            onClick={fetchData}
            className="mt-2 text-sm underline hover:no-underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 통계 카드 */}
      <StatsCards data={data} loading={loading} />

      {/* 취약점 목록 */}
      <div className="rounded-lg border border-border-default bg-bg-card p-6">
        {/* 필터 영역 */}
        <div className="mb-6 space-y-4">
          {/* 검색 */}
          <SearchInput
            value={searchText}
            onChange={setSearchText}
            vulnerabilities={data?.data || []}
          />

          {/* 심각도 필터 */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <SeverityFilter selected={severityFilter} onSelect={setSeverityFilter} />
            {severityFilter.length > 0 && (
              <button
                onClick={() => setSeverityFilter([])}
                className="text-xs text-text-muted hover:text-star transition-colors"
              >
                필터 초기화
              </button>
            )}
          </div>
        </div>

        {/* 소스 탭 및 취약점 목록 */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-star">
            최근 취약점
            {filteredVulnerabilities.length !== (data?.data.length ?? 0) && (
              <span className="ml-2 text-sm font-normal text-text-muted">
                ({filteredVulnerabilities.length}개 표시)
              </span>
            )}
          </h2>
          <SourceTabs
            selected={sourceFilter}
            onSelect={setSourceFilter}
            counts={data?.meta.sources}
          />
        </div>

        <VulnList
          vulnerabilities={filteredVulnerabilities}
          loading={loading}
          searchQuery={searchText}
        />
      </div>
    </div>
  );
}
