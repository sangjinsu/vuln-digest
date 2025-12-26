// 취약점 소스 타입
export type VulnSource = 'nvd' | 'cisa' | 'github' | 'npm' | 'pypi' | 'maven';

// 심각도 타입
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'unknown';

// 보고서 타입
export type ReportType = 'summary' | 'detailed';

// 기간 범위 타입
export type DateRange = '24h' | 'week' | 'month';

// 취약점 인터페이스
export interface Vulnerability {
  id: string;                    // CVE-2024-XXXX 또는 GHSA-xxxx
  source: VulnSource;
  severity: Severity;
  cvssScore?: number;
  title: string;
  description: string;
  affectedProducts: string[];
  publishedAt: string;           // ISO 8601
  url: string;                   // 원본 링크
  _fallback?: boolean;           // CISA: 24시간 내 데이터 없을 때 최근 N건 표시용
}

// 취약점 조회 파라미터
export interface VulnQueryParams {
  sources?: VulnSource[];
  dateRange?: DateRange;
  severity?: Severity[];
  limit?: number;
}

// 취약점 응답
export interface VulnResponse {
  data: Vulnerability[];
  meta: {
    total: number;
    sources: Record<VulnSource, number>;
    severities: Record<Severity, number>;
    fetchedAt: string;
  };
}

// 보고서 요청
export interface ReportRequest {
  sources: VulnSource[];
  dateRange: DateRange;
  reportType: ReportType;
}

// 보고서 응답
export interface Report {
  generatedAt: string;
  dateRange: DateRange;
  reportType: ReportType;
  markdown: string;
  meta: {
    totalVulnerabilities: number;
    sources: VulnSource[];
  };
}

// 소스별 메타 정보
export interface SourceInfo {
  id: VulnSource;
  name: string;
  description: string;
  url: string;
}

// 소스 정보 상수
export const SOURCE_INFO: Record<VulnSource, SourceInfo> = {
  nvd: {
    id: 'nvd',
    name: 'NVD',
    description: 'National Vulnerability Database',
    url: 'https://nvd.nist.gov',
  },
  cisa: {
    id: 'cisa',
    name: 'CISA KEV',
    description: 'Known Exploited Vulnerabilities',
    url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
  },
  github: {
    id: 'github',
    name: 'GitHub Advisory',
    description: 'GitHub Security Advisories',
    url: 'https://github.com/advisories',
  },
  npm: {
    id: 'npm',
    name: 'npm',
    description: 'npm Security Advisories',
    url: 'https://www.npmjs.com/advisories',
  },
  pypi: {
    id: 'pypi',
    name: 'PyPI',
    description: 'Python Package Index (via OSV)',
    url: 'https://pypi.org',
  },
  maven: {
    id: 'maven',
    name: 'Maven',
    description: 'Maven Central (via OSV)',
    url: 'https://mvnrepository.com',
  },
};

// 심각도별 색상 매핑 (Tailwind 클래스)
export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: 'bg-severity-critical',
  high: 'bg-severity-high',
  medium: 'bg-severity-medium',
  low: 'bg-severity-low',
  unknown: 'bg-text-muted',
};

// 심각도별 텍스트 색상
export const SEVERITY_TEXT_COLORS: Record<Severity, string> = {
  critical: 'text-severity-critical',
  high: 'text-severity-high',
  medium: 'text-severity-medium',
  low: 'text-severity-low',
  unknown: 'text-text-muted',
};
