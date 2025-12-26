import {
  Vulnerability,
  VulnQueryParams,
  VulnResponse,
  VulnSource,
  Severity,
} from '../types';
import { fetchNVDVulnerabilities } from './nvd';
import { fetchCISAVulnerabilities } from './cisa';
import { fetchGitHubVulnerabilities } from './github';
import { fetchPyPIVulnerabilities, fetchMavenVulnerabilities } from './osv';

type SourceFetcher = (params: VulnQueryParams) => Promise<Vulnerability[]>;

const SOURCE_FETCHERS: Partial<Record<VulnSource, SourceFetcher>> = {
  nvd: fetchNVDVulnerabilities,
  cisa: fetchCISAVulnerabilities,
  github: fetchGitHubVulnerabilities,
  pypi: fetchPyPIVulnerabilities,
  maven: fetchMavenVulnerabilities,
};

/**
 * 소스별 카운트 계산
 */
function countBySources(
  vulnerabilities: Vulnerability[]
): Record<VulnSource, number> {
  const counts: Record<VulnSource, number> = {
    nvd: 0,
    cisa: 0,
    github: 0,
    npm: 0,
    pypi: 0,
    maven: 0,
  };

  for (const vuln of vulnerabilities) {
    counts[vuln.source]++;
  }

  return counts;
}

/**
 * Severity별 카운트 계산
 */
function countBySeverities(
  vulnerabilities: Vulnerability[]
): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    unknown: 0,
  };

  for (const vuln of vulnerabilities) {
    counts[vuln.severity]++;
  }

  return counts;
}

/**
 * 통합 취약점 조회
 */
export async function fetchVulnerabilities(
  params: VulnQueryParams
): Promise<VulnResponse> {
  const {
    sources = ['nvd', 'cisa', 'github', 'pypi', 'maven'],
    dateRange = '24h',
    severity,
    limit = 100,
  } = params;

  // 지원되는 소스만 필터링
  const activeSources = sources.filter(
    (source) => SOURCE_FETCHERS[source] !== undefined
  );

  // 소스별 병렬 호출
  const fetchPromises = activeSources.map(async (source) => {
    const fetcher = SOURCE_FETCHERS[source];
    if (!fetcher) return [];

    try {
      return await fetcher({ dateRange, severity, limit });
    } catch (error) {
      console.error(`Failed to fetch from ${source}:`, error);
      return [];
    }
  });

  const results = await Promise.allSettled(fetchPromises);

  // 결과 병합
  const allVulnerabilities: Vulnerability[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allVulnerabilities.push(...result.value);
    }
  }

  // 중복 제거 (같은 CVE ID가 NVD와 CISA 양쪽에 있을 수 있음)
  const uniqueVulns = new Map<string, Vulnerability>();
  for (const vuln of allVulnerabilities) {
    const existing = uniqueVulns.get(vuln.id);
    // NVD 데이터 우선 (더 상세한 정보 포함)
    if (!existing || (existing.source === 'cisa' && vuln.source === 'nvd')) {
      uniqueVulns.set(vuln.id, vuln);
    }
  }

  // 날짜순 정렬 (최신순)
  let vulnerabilities = Array.from(uniqueVulns.values()).sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // limit 적용
  vulnerabilities = vulnerabilities.slice(0, limit);

  return {
    data: vulnerabilities,
    meta: {
      total: vulnerabilities.length,
      sources: countBySources(vulnerabilities),
      severities: countBySeverities(vulnerabilities),
      fetchedAt: new Date().toISOString(),
    },
  };
}

// 개별 소스 fetcher export
export { fetchNVDVulnerabilities } from './nvd';
export { fetchCISAVulnerabilities } from './cisa';
export { fetchGitHubVulnerabilities } from './github';
export { fetchPyPIVulnerabilities, fetchMavenVulnerabilities } from './osv';
