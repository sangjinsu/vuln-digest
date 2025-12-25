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

// ===== CISA KEV 응답 타입 =====

export interface CISAKEVResponse {
  title: string;
  catalogVersion: string;
  dateReleased: string;
  count: number;
  vulnerabilities: CISAKEVVulnerability[];
}

export interface CISAKEVVulnerability {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
  knownRansomwareCampaignUse: string;
  notes: string;
}
