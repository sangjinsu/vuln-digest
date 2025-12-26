import { NextRequest, NextResponse } from 'next/server';
import { fetchVulnerabilities } from '@/lib/sources';
import { VulnQueryParams, VulnSource, Severity, DateRange } from '@/lib/types';

// 유효한 값 검증용 상수
const VALID_SOURCES: VulnSource[] = ['nvd', 'cisa', 'github', 'npm', 'pypi', 'maven'];
const DEFAULT_SOURCES: VulnSource[] = ['nvd', 'cisa', 'github', 'pypi', 'maven'];
const VALID_SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low', 'unknown'];
const VALID_DATE_RANGES: DateRange[] = ['24h', 'week', 'month'];

/**
 * Query 파라미터 파싱
 */
function parseQueryParams(request: NextRequest): VulnQueryParams {
  const searchParams = request.nextUrl.searchParams;

  // sources 파싱 (쉼표 구분) - 기본값: 모든 구현된 소스
  const sourcesParam = searchParams.get('sources');
  const sources = sourcesParam
    ? (sourcesParam.split(',').filter((s) =>
        VALID_SOURCES.includes(s as VulnSource)
      ) as VulnSource[])
    : DEFAULT_SOURCES;

  // severity 파싱 (쉼표 구분)
  const severityParam = searchParams.get('severity');
  const severity = severityParam
    ? (severityParam.split(',').filter((s) =>
        VALID_SEVERITIES.includes(s as Severity)
      ) as Severity[])
    : undefined;

  // dateRange 파싱
  const dateRangeParam = searchParams.get('dateRange');
  const dateRange = VALID_DATE_RANGES.includes(dateRangeParam as DateRange)
    ? (dateRangeParam as DateRange)
    : undefined;

  // limit 파싱
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 200) : undefined;

  return { sources, dateRange, severity, limit };
}

export async function GET(request: NextRequest) {
  try {
    const params = parseQueryParams(request);
    const response = await fetchVulnerabilities(params);

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vulnerabilities' },
      { status: 500 }
    );
  }
}

// 캐시 재검증 주기 (5분)
export const revalidate = 300;
