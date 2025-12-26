// ===== NVD API 2.0 응답 타입 =====

export interface NVDResponse {
  resultsPerPage: number;
  startIndex: number;
  totalResults: number;
  format: string;
  version: string;
  timestamp: string;
  vulnerabilities: NVDVulnerabilityWrapper[];
}

export interface NVDVulnerabilityWrapper {
  cve: NVDCve;
}

export interface NVDCve {
  id: string;
  sourceIdentifier: string;
  published: string;
  lastModified: string;
  vulnStatus: string;
  descriptions: NVDDescription[];
  metrics?: NVDMetrics;
  configurations?: NVDConfiguration[];
  references?: NVDReference[];
}

export interface NVDDescription {
  lang: string;
  value: string;
}

export interface NVDMetrics {
  cvssMetricV31?: NVDCvssMetricV31[];
  cvssMetricV30?: NVDCvssMetricV30[];
  cvssMetricV2?: NVDCvssMetricV2[];
}

export interface NVDCvssMetricV31 {
  source: string;
  type: string;
  cvssData: {
    version: string;
    vectorString: string;
    baseScore: number;
    baseSeverity: string;
  };
}

export interface NVDCvssMetricV30 {
  source: string;
  type: string;
  cvssData: {
    version: string;
    vectorString: string;
    baseScore: number;
    baseSeverity: string;
  };
}

export interface NVDCvssMetricV2 {
  source: string;
  type: string;
  cvssData: {
    version: string;
    vectorString: string;
    baseScore: number;
  };
}

export interface NVDConfiguration {
  nodes: NVDNode[];
}

export interface NVDNode {
  operator: string;
  negate: boolean;
  cpeMatch: NVDCpeMatch[];
}

export interface NVDCpeMatch {
  vulnerable: boolean;
  criteria: string;
  matchCriteriaId: string;
}

export interface NVDReference {
  url: string;
  source: string;
  tags?: string[];
}

// ===== GitHub Advisory API 응답 타입 =====

export interface GitHubAdvisory {
  ghsa_id: string;
  cve_id: string | null;
  html_url: string;
  summary: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvss?: {
    score: number;
    vector_string: string;
  };
  published_at: string;
  updated_at: string;
  vulnerabilities: GitHubVulnerablePackage[];
}

export interface GitHubVulnerablePackage {
  package: {
    ecosystem: string;
    name: string;
  };
  vulnerable_version_range: string;
  first_patched_version: string | null;
}

