import { Vulnerability, VulnQueryParams, Severity } from '../types';
import { GitHubAdvisory } from './types';
import { dateRangeToStartDate } from '../utils/date';

const GITHUB_API_URL = 'https://api.github.com/advisories';

function mapSeverity(severity: string): Severity {
  const map: Record<string, Severity> = {
    critical: 'critical',
    high: 'high',
    medium: 'medium',
    moderate: 'medium',
    low: 'low',
  };
  return map[severity.toLowerCase()] ?? 'unknown';
}

function transformGitHubAdvisory(advisory: GitHubAdvisory): Vulnerability {
  const affectedProducts = advisory.vulnerabilities
    .map((v) => `${v.package.ecosystem}/${v.package.name}`)
    .slice(0, 10);

  return {
    id: advisory.ghsa_id,
    source: 'github',
    severity: mapSeverity(advisory.severity),
    cvssScore: advisory.cvss?.score,
    title: advisory.summary,
    description: advisory.description || advisory.summary,
    affectedProducts,
    publishedAt: advisory.published_at,
    url: advisory.html_url,
  };
}

export async function fetchGitHubVulnerabilities(
  params: VulnQueryParams
): Promise<Vulnerability[]> {
  const { dateRange = '24h', severity, limit = 50 } = params;
  const startDate = new Date(dateRangeToStartDate(dateRange));

  try {
    const headers: HeadersInit = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    // 선택적 토큰 인증
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(`${GITHUB_API_URL}?per_page=100`, {
      headers,
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data: GitHubAdvisory[] = await response.json();

    // 날짜 필터링
    let vulnerabilities = data
      .filter((advisory) => new Date(advisory.published_at) >= startDate)
      .map(transformGitHubAdvisory);

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
    console.error('Failed to fetch GitHub vulnerabilities:', error);
    return [];
  }
}
