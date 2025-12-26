import { Vulnerability, VulnQueryParams } from '../types';
import { CISAKEVResponse, CISAKEVVulnerability } from './types';
import { dateRangeToStartDate, parseYYYYMMDD } from '../utils/date';

const CISA_KEV_URL =
  'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';

/**
 * CISA KEV -> Vulnerability 변환
 */
function transformCISAVulnerability(kev: CISAKEVVulnerability): Vulnerability {
  const publishedAt = parseYYYYMMDD(kev.dateAdded).toISOString();

  return {
    id: kev.cveID,
    source: 'cisa',
    severity: 'critical', // KEV는 모두 실제 악용됨 -> critical
    cvssScore: undefined,
    title: kev.vulnerabilityName,
    description: kev.shortDescription,
    affectedProducts: [`${kev.vendorProject} ${kev.product}`],
    publishedAt,
    url: `https://nvd.nist.gov/vuln/detail/${kev.cveID}`,
  };
}

/**
 * CISA KEV API 호출
 */
export async function fetchCISAVulnerabilities(
  params: VulnQueryParams
): Promise<Vulnerability[]> {
  const { dateRange = '24h', severity, limit = 50 } = params;

  try {
    const response = await fetch(CISA_KEV_URL, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`CISA KEV API error: ${response.status}`);
    }

    const data: CISAKEVResponse = await response.json();
    const startDate = new Date(dateRangeToStartDate(dateRange));
    // CISA는 날짜만 있으므로 시간을 00:00:00으로 맞춤
    startDate.setHours(0, 0, 0, 0);

    // dateAdded 필터링
    let vulnerabilities = data.vulnerabilities
      .filter((kev) => {
        const addedDate = parseYYYYMMDD(kev.dateAdded);
        return addedDate >= startDate;
      })
      .map(transformCISAVulnerability);

    // Severity 필터링 (KEV는 모두 critical이므로 critical 포함 시에만 반환)
    if (severity && severity.length > 0 && !severity.includes('critical')) {
      return [];
    }

    // 최신 순 정렬
    vulnerabilities.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return vulnerabilities.slice(0, limit);
  } catch (error) {
    console.error('Failed to fetch CISA KEV vulnerabilities:', error);
    return [];
  }
}
