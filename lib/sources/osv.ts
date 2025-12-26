import { Vulnerability, VulnQueryParams, Severity, VulnSource } from '../types';
import { OSVVulnerability } from './types';
import { dateRangeToStartDate } from '../utils/date';

const OSV_API_URL = 'https://api.osv.dev/v1/query';

// 인기 패키지 목록 (OSV는 패키지별 쿼리만 지원)
const PYPI_PACKAGES = [
  'requests',
  'django',
  'flask',
  'numpy',
  'pandas',
  'pillow',
  'cryptography',
  'urllib3',
  'aiohttp',
  'fastapi',
];

const MAVEN_PACKAGES = [
  'org.springframework:spring-core',
  'org.apache.logging.log4j:log4j-core',
  'com.google.guava:guava',
  'org.apache.commons:commons-lang3',
  'com.fasterxml.jackson.core:jackson-databind',
  'org.apache.httpcomponents:httpclient',
  'io.netty:netty-all',
  'org.apache.tomcat.embed:tomcat-embed-core',
];

function parseCvssScore(severity: { type: string; score: string }[]): number | undefined {
  const cvss = severity.find(
    (s) => s.type === 'CVSS_V3' || s.type === 'CVSS_V2'
  );
  if (cvss) {
    // CVSS 벡터 문자열에서 점수 추출 또는 직접 점수
    const scoreMatch = cvss.score.match(/(\d+\.?\d*)/);
    return scoreMatch ? parseFloat(scoreMatch[1]) : undefined;
  }
  return undefined;
}

function cvssToSeverity(score: number | undefined): Severity {
  if (score === undefined) return 'unknown';
  if (score >= 9.0) return 'critical';
  if (score >= 7.0) return 'high';
  if (score >= 4.0) return 'medium';
  if (score >= 0.1) return 'low';
  return 'unknown';
}

function transformOSVVulnerability(
  vuln: OSVVulnerability,
  source: VulnSource
): Vulnerability {
  const cvssScore = vuln.severity ? parseCvssScore(vuln.severity) : undefined;

  const affectedProducts =
    vuln.affected?.map((a) => `${a.package.ecosystem}/${a.package.name}`).slice(0, 10) || [];

  const url =
    vuln.references?.find((r) => r.type === 'ADVISORY')?.url ||
    `https://osv.dev/vulnerability/${vuln.id}`;

  return {
    id: vuln.id,
    source,
    severity: cvssToSeverity(cvssScore),
    cvssScore,
    title: vuln.summary || vuln.id,
    description: vuln.details || vuln.summary || '',
    affectedProducts,
    publishedAt: vuln.published,
    url,
  };
}

async function fetchOSVForPackage(
  ecosystem: string,
  packageName: string
): Promise<OSVVulnerability[]> {
  try {
    const response = await fetch(OSV_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        package: {
          ecosystem,
          name: packageName,
        },
      }),
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.vulns || [];
  } catch {
    return [];
  }
}

async function fetchOSVVulnerabilities(
  ecosystem: string,
  packages: string[],
  source: VulnSource,
  params: VulnQueryParams
): Promise<Vulnerability[]> {
  const { dateRange = '24h', severity, limit = 50 } = params;
  const startDate = new Date(dateRangeToStartDate(dateRange));

  try {
    // 패키지별로 병렬 요청
    const promises = packages.map((pkg) => fetchOSVForPackage(ecosystem, pkg));
    const results = await Promise.all(promises);

    // 모든 결과 병합
    const allVulns = results.flat();

    // 중복 제거 (ID 기준)
    const uniqueVulns = Array.from(
      new Map(allVulns.map((v) => [v.id, v])).values()
    );

    // 날짜 필터링 및 변환
    let vulnerabilities = uniqueVulns
      .filter((vuln) => new Date(vuln.published) >= startDate)
      .map((vuln) => transformOSVVulnerability(vuln, source));

    // Severity 필터링
    if (severity && severity.length > 0) {
      vulnerabilities = vulnerabilities.filter((v) =>
        severity.includes(v.severity)
      );
    }

    // 정렬 및 제한
    return vulnerabilities
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )
      .slice(0, limit);
  } catch (error) {
    console.error(`Failed to fetch ${source} vulnerabilities:`, error);
    return [];
  }
}

export async function fetchPyPIVulnerabilities(
  params: VulnQueryParams
): Promise<Vulnerability[]> {
  return fetchOSVVulnerabilities('PyPI', PYPI_PACKAGES, 'pypi', params);
}

export async function fetchMavenVulnerabilities(
  params: VulnQueryParams
): Promise<Vulnerability[]> {
  return fetchOSVVulnerabilities('Maven', MAVEN_PACKAGES, 'maven', params);
}
