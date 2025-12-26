import { Vulnerability, VulnQueryParams, Severity } from '../types';
import { NVDResponse, NVDVulnerabilityWrapper, NVDCve } from './types';
import { dateRangeToStartDate, formatDateISO } from '../utils/date';

const NVD_API_BASE = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const DEFAULT_RESULTS_PER_PAGE = 50;

/**
 * CVSS v3.1 점수 -> Severity 변환
 */
export function cvssToSeverity(score: number | undefined): Severity {
  if (score === undefined || score === null) return 'unknown';
  if (score >= 9.0) return 'critical';
  if (score >= 7.0) return 'high';
  if (score >= 4.0) return 'medium';
  if (score >= 0.1) return 'low';
  return 'unknown';
}

/**
 * CVSS 점수 추출 (v3.1 우선, 없으면 v3.0, 없으면 v2)
 */
export function extractCvssScore(cve: NVDCve): number | undefined {
  const metrics = cve.metrics;
  if (!metrics) return undefined;

  if (metrics.cvssMetricV31?.[0]) {
    return metrics.cvssMetricV31[0].cvssData.baseScore;
  }
  if (metrics.cvssMetricV30?.[0]) {
    return metrics.cvssMetricV30[0].cvssData.baseScore;
  }
  if (metrics.cvssMetricV2?.[0]) {
    return metrics.cvssMetricV2[0].cvssData.baseScore;
  }
  return undefined;
}

/**
 * 영문 description 추출
 */
function extractDescription(cve: NVDCve): string {
  const enDesc = cve.descriptions.find((d) => d.lang === 'en');
  return enDesc?.value ?? cve.descriptions[0]?.value ?? 'No description available';
}

/**
 * 영향받는 제품 추출 (CPE에서)
 */
function extractAffectedProducts(cve: NVDCve): string[] {
  const products: string[] = [];

  cve.configurations?.forEach((config) => {
    config.nodes?.forEach((node) => {
      node.cpeMatch?.forEach((match) => {
        if (match.vulnerable && match.criteria) {
          // CPE 형식: cpe:2.3:a:vendor:product:version:...
          const parts = match.criteria.split(':');
          if (parts.length >= 5) {
            const vendor = parts[3];
            const product = parts[4];
            const productStr = `${vendor}:${product}`;
            if (!products.includes(productStr)) {
              products.push(productStr);
            }
          }
        }
      });
    });
  });

  return products.slice(0, 10);
}

/**
 * NVD 응답 -> Vulnerability 변환
 */
function transformNVDVulnerability(wrapper: NVDVulnerabilityWrapper): Vulnerability {
  const cve = wrapper.cve;
  const cvssScore = extractCvssScore(cve);
  const description = extractDescription(cve);

  return {
    id: cve.id,
    source: 'nvd',
    severity: cvssToSeverity(cvssScore),
    cvssScore,
    title: `${cve.id}: ${description.slice(0, 100)}${description.length > 100 ? '...' : ''}`,
    description,
    affectedProducts: extractAffectedProducts(cve),
    publishedAt: cve.published,
    url: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
  };
}

/**
 * NVD API 호출
 */
export async function fetchNVDVulnerabilities(
  params: VulnQueryParams
): Promise<Vulnerability[]> {
  const { dateRange = '24h', severity, limit = DEFAULT_RESULTS_PER_PAGE } = params;

  const startDate = dateRangeToStartDate(dateRange);
  const endDate = formatDateISO(new Date());

  const url = new URL(NVD_API_BASE);
  url.searchParams.set('pubStartDate', startDate);
  url.searchParams.set('pubEndDate', endDate);
  url.searchParams.set('resultsPerPage', String(Math.min(limit, 100)));

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      if (response.status === 403) {
        console.error('NVD API rate limit exceeded');
      }
      throw new Error(`NVD API error: ${response.status}`);
    }

    const data: NVDResponse = await response.json();
    let vulnerabilities = data.vulnerabilities.map(transformNVDVulnerability);

    // Severity 필터링
    if (severity && severity.length > 0) {
      vulnerabilities = vulnerabilities.filter((v) =>
        severity.includes(v.severity)
      );
    }

    return vulnerabilities;
  } catch (error) {
    console.error('Failed to fetch NVD vulnerabilities:', error);
    return [];
  }
}

/**
 * 단일 CVE ID로 심각도 조회
 */
export async function fetchCVESeverity(
  cveId: string
): Promise<{ severity: Severity; cvssScore?: number } | null> {
  const url = `${NVD_API_BASE}?cveId=${cveId}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 }, // 24시간 캐싱
    });

    if (!response.ok) return null;

    const data: NVDResponse = await response.json();
    if (data.vulnerabilities.length === 0) return null;

    const cve = data.vulnerabilities[0].cve;
    const cvssScore = extractCvssScore(cve);

    return {
      severity: cvssToSeverity(cvssScore),
      cvssScore,
    };
  } catch {
    return null;
  }
}
