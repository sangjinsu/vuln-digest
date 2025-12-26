# VulnDigest - 보안 취약점 모니터링 서비스

## 프로젝트 개요

AI가 정리해주는 보안 취약점 브리핑 서비스. 여러 보안 취약점 소스에서 데이터를 수집하고, Claude API를 활용해 한국어 보고서를 생성하는 웹 애플리케이션.

### 핵심 가치
- 실시간 취약점 조회 (DB 저장 없음)
- Claude API 기반 한국어 보고서 자동 생성
- 마크다운 형식 보고서 복사 지원
- 밤하늘 테마 UI

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | Next.js 16.0.10 (App Router) |
| 언어 | TypeScript (strict mode) |
| 스타일링 | Tailwind CSS v4 |
| UI 컴포넌트 | 커스텀 컴포넌트 (Tailwind v4 네이티브) |
| AI | Anthropic Claude API |
| 배포 | Vercel (Production) |

## 아키텍처

```
┌─────────────────────────────────────────┐
│            Next.js (App Router)          │
│  ┌─────────────────────────────────────┐│
│  │  API Routes                         ││
│  │  - GET  /api/vulnerabilities        ││
│  │  - POST /api/report/generate        ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │  React Server Components            ││
│  │  - 대시보드, 보고서 뷰어             ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
         │                    │
         ▼                    ▼
   ┌──────────┐        ┌──────────┐
   │ 취약점   │        │ Claude   │
   │ APIs     │        │ API      │
   └──────────┘        └──────────┘
```

### 핵심 원칙
- **No Database**: 취약점 데이터 저장 없음, 실시간 조회
- **24시간 기본**: 화면 접속 시 최근 24시간 내 취약점만 기본 표시
- **캐싱**: Next.js fetch 캐시 활용 (revalidate: 300초)
- **Server Components 우선**: 클라이언트 컴포넌트 최소화

## 데이터 소스

| 소스 | API/URL | 용도 | 비고 |
|------|---------|------|------|
| NVD | `https://services.nvd.nist.gov/rest/json/cves/2.0` | 범용 CVE | API 키 권장 |
| CISA KEV | `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json` | 실제 악용 취약점 | 업데이트 빈도 낮음 |
| GitHub Advisory | `https://api.github.com/advisories` | GitHub + npm + PyPI + Maven 통합 | **Token 필수** |

### ⚠️ OSV API 미사용 이유

OSV API (osv.dev)는 **시간 기반 조회를 지원하지 않음**:
```javascript
// ❌ OSV는 패키지명 필수 - "최근 24시간" 쿼리 불가
POST https://api.osv.dev/v1/query
{
  "package": { "name": "requests", "ecosystem": "PyPI" }  // 패키지명 필수!
}
```

대신 **GitHub Advisory API**로 모든 생태계 통합:
```javascript
// ✅ GitHub Advisory - 시간 + 생태계 필터링 가능
GET https://api.github.com/advisories?ecosystem=pip&published=2024-12-26..
GET https://api.github.com/advisories?ecosystem=maven&published=2024-12-26..
GET https://api.github.com/advisories?ecosystem=npm&published=2024-12-26..
```

### GitHub Advisory 생태계 매핑

| 표시명 | ecosystem 파라미터 |
|--------|-------------------|
| npm | `npm` |
| PyPI | `pip` |
| Maven | `maven` |
| Go | `go` |
| RubyGems | `rubygems` |
| Rust | `crates.io` |

### Rate Limit 주의

| 소스 | 인증 없음 | 인증 있음 |
|------|----------|----------|
| **NVD** | 5 req/30초 | 50 req/30초 (API 키) |
| **GitHub** | 60 req/시간 | **5,000 req/시간** (Token) |
| **CISA** | 제한 없음 | - |

### 캐싱 전략 (토큰 유무에 따라)

```typescript
// 토큰 있음: 1분 캐싱 (더 실시간)
// 5,000 req/hour ÷ 180 req/hour (3생태계 × 60회) = 약 27배 여유

// 토큰 없음: 5분 캐싱 (Rate Limit 보호)
// 60 req/hour ÷ 36 req/hour (3생태계 × 12회) = 여유 있음
```

**Vercel 서버리스**: 캐시가 서버에서 공유되므로 토큰 없이도 안정적 운영 가능

## 프로젝트 구조

```
vuln-digest/
├── app/
│   ├── layout.tsx              # 루트 레이아웃 (밤하늘 테마)
│   ├── page.tsx                # 메인 대시보드
│   ├── report/
│   │   └── page.tsx            # 보고서 페이지
│   ├── globals.css             # 글로벌 스타일 + 테마 변수
│   └── api/
│       ├── vulnerabilities/
│       │   └── route.ts        # 취약점 조회 API
│       └── report/
│           └── generate/
│               └── route.ts    # 보고서 생성 API
├── components/
│   ├── dashboard/
│   │   ├── SourceTabs.tsx      # 소스별 탭 (NVD, CISA, npm 등)
│   │   ├── SeverityChart.tsx   # 심각도별 도넛/바 차트
│   │   ├── VulnList.tsx        # 취약점 목록
│   │   ├── VulnCard.tsx        # 개별 취약점 카드
│   │   ├── DateRangePicker.tsx # 기간 선택 (24h/week/month)
│   │   └── StatsCards.tsx      # 통계 카드
│   ├── report/
│   │   ├── ReportViewer.tsx    # 마크다운 렌더링
│   │   ├── ReportOptions.tsx   # 형식/기간/소스/모델 선택
│   │   ├── ModelSelector.tsx   # Claude 모델 선택 드롭다운
│   │   ├── CopyButton.tsx      # 마크다운 복사 버튼
│   │   └── GenerateButton.tsx  # 보고서 생성 버튼
│   ├── layout/
│   │   ├── Header.tsx          # 상단 네비게이션
│   │   ├── Footer.tsx          # 하단 푸터
│   │   └── Sidebar.tsx         # (선택) 사이드바
│   └── ui/                     # 공통 UI 컴포넌트 (Button, Card, Modal 등)
├── lib/
│   ├── sources/
│   │   ├── index.ts            # 통합 인터페이스
│   │   ├── nvd.ts              # NVD API 클라이언트
│   │   ├── cisa.ts             # CISA KEV 클라이언트 (fallback 포함)
│   │   └── github.ts           # GitHub Advisory (npm/PyPI/Maven 통합)
│   ├── claude.ts               # Claude API 래퍼
│   ├── prompts.ts              # 보고서 생성 프롬프트
│   ├── cache.ts                # 캐시 유틸리티
│   ├── types.ts                # TypeScript 타입 정의
│   └── utils.ts                # 공통 유틸리티
├── .env.local                  # 환경 변수 (gitignore)
├── .env.example                # 환경 변수 예시
├── app/globals.css             # Tailwind v4 설정 + 테마 변수
├── next.config.ts              # Next.js 설정
└── package.json
```

## 타입 정의

```typescript
// lib/types.ts

export type VulnSource = 'nvd' | 'cisa' | 'github' | 'npm' | 'pypi' | 'maven';
// npm, pypi, maven은 내부적으로 GitHub Advisory API 사용
// github은 GitHub 자체 보안 이슈 (ecosystem 필터 없이 조회)
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'unknown';
export type ReportType = 'summary' | 'detailed';
export type DateRange = '24h' | 'week' | 'month';  // 기본값: 24h

// Claude 모델 선택
export type ClaudeModel = 
  | 'claude-sonnet-4-20250514'      // Sonnet 4 (기본값 - 균형)
  | 'claude-opus-4-20250514'        // Opus 4 (최고 품질)
  | 'claude-haiku-3-5-20241022';    // Haiku 3.5 (빠름, 저렴)

export const CLAUDE_MODELS: { id: ClaudeModel; name: string; description: string }[] = [
  { id: 'claude-sonnet-4-20250514', name: 'Sonnet 4', description: '균형 잡힌 성능 (기본)' },
  { id: 'claude-opus-4-20250514', name: 'Opus 4', description: '최고 품질, 복잡한 분석' },
  { id: 'claude-haiku-3-5-20241022', name: 'Haiku 3.5', description: '빠른 응답, 비용 절약' },
];

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

export interface VulnQueryParams {
  sources?: VulnSource[];
  dateRange?: DateRange;
  severity?: Severity[];
  limit?: number;
}

export interface VulnResponse {
  data: Vulnerability[];
  meta: {
    total: number;
    sources: Record<VulnSource, number>;
    severities: Record<Severity, number>;
    fetchedAt: string;
  };
}

export interface ReportRequest {
  sources: VulnSource[];
  dateRange: DateRange;
  reportType: ReportType;
  model?: ClaudeModel;            // 기본값: claude-sonnet-4-20250514
}

export interface Report {
  generatedAt: string;
  dateRange: DateRange;
  reportType: ReportType;
  markdown: string;
  meta: {
    totalVulnerabilities: number;
    sources: VulnSource[];
    model: ClaudeModel;           // 사용된 모델 표시
  };
}
```

## API 명세

### GET /api/vulnerabilities

취약점 목록 조회 (캐시: 5분)

**Query Parameters:**
| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| sources | string | 전체 | 콤마 구분 (nvd,cisa,npm) |
| dateRange | string | 24h | 24h, week, month |
| severity | string | 전체 | 콤마 구분 (critical,high) |
| limit | number | 100 | 최대 반환 개수 |

**Response:**
```json
{
  "data": [
    {
      "id": "CVE-2024-12345",
      "source": "nvd",
      "severity": "critical",
      "cvssScore": 9.8,
      "title": "...",
      "description": "...",
      "affectedProducts": ["product-a", "product-b"],
      "publishedAt": "2024-12-24T00:00:00Z",
      "url": "https://nvd.nist.gov/vuln/detail/CVE-2024-12345"
    }
  ],
  "meta": {
    "total": 42,
    "sources": { "nvd": 20, "cisa": 5, "npm": 17 },
    "severities": { "critical": 3, "high": 15, "medium": 20, "low": 4 },
    "fetchedAt": "2024-12-24T10:00:00Z"
  }
}
```

### POST /api/report/generate

Claude API로 보고서 생성

**Request Body:**
```json
{
  "sources": ["nvd", "cisa", "npm"],
  "dateRange": "24h",
  "reportType": "summary",
  "model": "claude-sonnet-4-20250514"  // 선택 (기본값: sonnet-4)
}
```

**모델 옵션:**
| 모델 | 설명 | 용도 |
|------|------|------|
| `claude-sonnet-4-20250514` | Sonnet 4 (기본) | 일반 보고서 |
| `claude-opus-4-20250514` | Opus 4 | 심층 분석, 복잡한 보고서 |
| `claude-haiku-3-5-20241022` | Haiku 3.5 | 빠른 요약, 비용 절약 |

**Response:**
```json
{
  "generatedAt": "2024-12-24T10:05:00Z",
  "dateRange": "24h",
  "reportType": "summary",
  "markdown": "# 보안 취약점 브리핑 (최근 24시간)\n\n## 요약\n...",
  "meta": {
    "totalVulnerabilities": 42,
    "sources": ["nvd", "cisa", "npm"],
    "model": "claude-sonnet-4-20250514"
  }
}
```

## UI/UX 요구사항

### Tailwind CSS v4 설정

Tailwind v4는 CSS 기반 설정을 사용합니다. `tailwind.config.js` 대신 `globals.css`에서 직접 설정:

```css
/* app/globals.css */
@import "tailwindcss";

/* 밤하늘 테마 커스텀 설정 */
@theme {
  /* 배경 */
  --color-bg-primary: #0a0a1a;
  --color-bg-secondary: #12122a;
  --color-bg-card: #1a1a3a;
  
  /* 강조색 (별빛) */
  --color-star: #f0f0ff;
  --color-star-blue: #60a5fa;
  --color-star-purple: #a78bfa;
  --color-star-cyan: #22d3ee;
  
  /* 심각도 색상 */
  --color-severity-critical: #ef4444;
  --color-severity-high: #f97316;
  --color-severity-medium: #eab308;
  --color-severity-low: #22c55e;
  
  /* 텍스트 */
  --color-text-primary: #f0f0ff;
  --color-text-secondary: #a0a0c0;
  --color-text-muted: #606080;
  
  /* 보더 */
  --color-border-default: #2a2a4a;
  --color-border-hover: #3a3a5a;
  
  /* 그라데이션 */
  --gradient-night: linear-gradient(to bottom, #0a0a1a, #1a1a3a, #2a1a4a);
  --gradient-aurora: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 기본 스타일 */
body {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}
```

### 밤하늘 테마 컬러 팔레트

```css
/* Tailwind v4 유틸리티 클래스로 사용 */
bg-bg-primary      /* #0a0a1a - 깊은 밤하늘 */
bg-bg-secondary    /* #12122a - 약간 밝은 배경 */
bg-bg-card         /* #1a1a3a - 카드 배경 */

text-star          /* #f0f0ff - 밝은 별 */
text-star-blue     /* #60a5fa - 파란 별 */
text-star-purple   /* #a78bfa - 보라 별 */
text-star-cyan     /* #22d3ee - 청록 별 */

bg-severity-critical  /* #ef4444 - Critical */
bg-severity-high      /* #f97316 - High */
bg-severity-medium    /* #eab308 - Medium */
bg-severity-low       /* #22c55e - Low */

border-border-default  /* #2a2a4a */
border-border-hover    /* #3a3a5a */
```

### UI 컴포넌트 스타일 가이드

- **카드**: 반투명 배경 + 미세한 글로우 효과
- **버튼**: 그라데이션 배경, hover 시 글로우
- **테이블/리스트**: 행 구분선 미세하게, hover 시 하이라이트
- **차트**: 네온 느낌의 색상, 어두운 배경과 대비
- **아이콘**: Lucide React 사용
- **폰트**: Pretendard 또는 시스템 폰트

### 반응형 브레이크포인트
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 주요 화면

### 1. 메인 대시보드 (`/`)
- 상단: 통계 카드 (24시간 내 신규, Critical 수, 소스별 현황)
- 중단: 소스별 탭 + 취약점 목록 **(기본: 24시간 내 취약점만 표시)**
   - 탭: 전체 | NVD | CISA KEV | npm | PyPI | Maven
   - CISA에 "(최근 추가)" 라벨 표시 (fallback 시)
- 우측 또는 하단: 심각도 차트
- 플로팅: "보고서 생성" 버튼
- 기간 필터: 24시간 (기본) / 1주일 / 1개월

### 2. 보고서 페이지 (`/report`)
- 좌측: 옵션 패널
   - 소스 선택 (NVD, CISA, npm, PyPI, Maven)
   - 기간 선택 (24시간, 1주일, 1개월)
   - 형식 선택 (요약/상세)
   - **모델 선택** (Sonnet 4 / Opus 4 / Haiku 3.5)
- 우측: 보고서 뷰어 (마크다운 렌더링)
- 상단 우측: "마크다운 복사" 버튼
- 하단: 사용된 모델 표시
- 생성 중: 로딩 스피너 + 스트리밍 표시

## Claude 보고서 프롬프트

### 요약형 (summary)
```
당신은 보안 전문가입니다. 다음 취약점 데이터를 분석하여 한국어로 간결한 보고서를 작성해주세요.

## 보고서 형식
- 제목: 기간 명시 (예: "보안 취약점 브리핑 - 최근 24시간" 또는 "주간 보고서")
- 핵심 요약: 3-5문장
- 주요 취약점: Critical/High만 bullet point로
- 영향받는 주요 제품/패키지
- 권장 조치사항

## 작성 원칙
- 기술적이지만 이해하기 쉽게
- 구체적인 CVE ID 포함
- 마크다운 형식 사용
```

### 상세형 (detailed)
```
당신은 보안 전문가입니다. 다음 취약점 데이터를 분석하여 한국어로 상세한 보고서를 작성해주세요.

## 보고서 형식
- 제목: 기간 명시 (예: "보안 취약점 상세 보고서 - 최근 24시간")
- 개요: 전체 현황 요약
- 심각도별 분석: Critical → High → Medium → Low 순
- 소스별 분석: 각 소스별 주요 내용
- 영향 분석: 영향받는 제품/패키지 상세
- 권장 조치사항: 우선순위별 정리
- 참고 링크: 주요 취약점 원본 링크

## 작성 원칙
- 상세하고 전문적으로
- 각 취약점에 대한 설명 포함
- CVSS 점수 명시
- 마크다운 형식 사용
```

## 환경 변수

```bash
# .env.local

# 필수
ANTHROPIC_API_KEY=sk-ant-...

# 권장 (Rate Limit 완화 + 캐싱 주기 단축)
GITHUB_TOKEN=ghp_xxxxxxxxxxxx    # GitHub Advisory API (npm/PyPI/Maven)
NVD_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# 설정
CACHE_TTL=300                    # 캐시 유지 시간 (초) - 토큰 있으면 60으로 단축 가능
DEFAULT_VULN_LIMIT=100           # 기본 조회 개수
DEFAULT_MODEL=claude-sonnet-4-20250514  # 기본 Claude 모델
```

### GitHub Token 효과

| 항목 | 토큰 없음 | 토큰 있음 |
|------|----------|----------|
| Rate Limit | 60 req/hour | **5,000 req/hour** |
| 캐싱 주기 | 5분 (필수) | **1분 가능** |
| 생태계 확장 | 제한적 | Go, Rust 등 추가 여유 |
| 안정성 | Rate Limit 에러 가능 | 거의 무제한 |

### Claude 모델 비교

| 모델 | 속도 | 품질 | 비용 | 권장 용도 |
|------|------|------|------|----------|
| **Haiku 3.5** | ⚡ 매우 빠름 | 보통 | 💰 저렴 | 빠른 요약, 테스트 |
| **Sonnet 4** | 빠름 | 좋음 | 💰💰 중간 | 일반 보고서 (기본) |
| **Opus 4** | 보통 | 최고 | 💰💰💰 높음 | 심층 분석, 중요 보고서 |

### 토큰 유무에 따른 캐싱 전략

```typescript
// lib/cache.ts
export const CACHE_TTL = process.env.GITHUB_TOKEN 
  ? 60      // 1분 (토큰 있음 - 더 실시간)
  : 300;    // 5분 (토큰 없음 - Rate Limit 보호)
```

### GitHub Token 발급
1. GitHub → Settings → Developer settings → Personal access tokens
2. "Generate new token (classic)" 선택
3. 권한: `public_repo` (읽기 전용이면 권한 없이도 가능)
4. 발급된 토큰을 `GITHUB_TOKEN`에 설정

## 패키지 버전

```json
{
  "dependencies": {
    "next": "16.0.10",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@anthropic-ai/sdk": "^0.39.0",
    "lucide-react": "^0.468.0",
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "16.0.10"
  }
}
```

### Next.js 16 설정

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 실험적 기능
  experimental: {
    // 필요시 추가
  },
  
  // 이미지 도메인 (외부 이미지 사용 시)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com',
      },
    ],
  },
};

export default nextConfig;
```

### Tailwind v4 PostCSS 설정

```js
// postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {}
  }
};
```

## 개발 가이드라인

### 코딩 규칙
1. **TypeScript strict mode** 사용
2. **함수형 컴포넌트** + hooks 사용
3. **Server Components 우선**, 필요시에만 'use client'
4. **에러 핸들링**: try-catch + 사용자 친화적 에러 메시지
5. **로딩 상태**: 모든 비동기 작업에 로딩 UI 제공

### 네이밍 규칙
- 컴포넌트: PascalCase (`VulnCard.tsx`)
- 함수/변수: camelCase (`fetchVulnerabilities`)
- 상수: UPPER_SNAKE_CASE (`API_BASE_URL`)
- 타입/인터페이스: PascalCase (`Vulnerability`)
- 파일: kebab-case 또는 PascalCase (컴포넌트)

### Git 커밋 메시지
```
feat: 새 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 리팩토링
test: 테스트 추가
chore: 빌드, 설정 변경
```

## 개발 우선순위 (MVP)

### Phase 1: 기본 구조 (Day 1)
- [x] 프로젝트 셋업
- [ ] 밤하늘 테마 적용 (globals.css, tailwind.config)
- [ ] 기본 레이아웃 (Header, 메인 구조)
- [ ] 타입 정의

### Phase 2: 데이터 수집 (Day 1-2)
- [ ] NVD 클라이언트 구현
- [ ] CISA 클라이언트 구현 (fallback 포함)
- [ ] GitHub Advisory 클라이언트 (npm/PyPI/Maven 통합)
- [ ] /api/vulnerabilities 엔드포인트
- [ ] 캐싱 적용

### Phase 3: 대시보드 UI (Day 2)
- [ ] 통계 카드
- [ ] 소스별 탭 (전체/NVD/CISA/npm/PyPI/Maven)
- [ ] 취약점 목록
- [ ] 심각도 차트
- [ ] CISA fallback 라벨 표시

### Phase 4: 보고서 생성 (Day 2-3)
- [ ] Claude API 연동
- [ ] 프롬프트 구현
- [ ] /api/report/generate 엔드포인트
- [ ] 보고서 뷰어 UI
- [ ] 마크다운 복사 기능

### Phase 5: 마무리 (Day 3)
- [ ] 에러 처리 보강
- [ ] 로딩/스켈레톤 UI
- [ ] 반응형 점검
- [ ] 빈 상태 UI (데이터 없을 때)

## 데이터 수집 로직

### CISA KEV - Fallback 처리

CISA KEV는 업데이트 빈도가 낮아 24시간 내 데이터가 없을 수 있음:

```typescript
// lib/sources/cisa.ts
const CISA_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';

export async function fetchCISA(dateRange: DateRange): Promise<Vulnerability[]> {
  const response = await fetch(CISA_URL, { next: { revalidate: 300 } });
  const data = await response.json();
  
  const filtered = filterByDate(data.vulnerabilities, dateRange);
  
  // ⚠️ Fallback: 24시간 내 데이터 없으면 최근 5건 표시
  if (filtered.length === 0 && dateRange === '24h') {
    const recent = data.vulnerabilities
      .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
      .slice(0, 5);
    
    return recent.map(v => ({
      ...normalize(v),
      _fallback: true  // UI에서 "최근 추가" 표시용
    }));
  }
  
  return filtered.map(normalize);
}
```

### GitHub Advisory - 생태계별 통합 조회

```typescript
// lib/sources/github.ts
import { CACHE_TTL } from '../cache';

type Ecosystem = 'npm' | 'pip' | 'maven' | 'go' | 'rubygems';

const GITHUB_API = 'https://api.github.com/advisories';

export async function fetchGitHubAdvisories(
  ecosystem: Ecosystem,
  dateRange: DateRange
): Promise<Vulnerability[]> {
  const since = getDateRangeISO(dateRange);
  
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  
  // 토큰 있으면 추가 (Rate Limit 5,000/hour)
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  
  const response = await fetch(
    `${GITHUB_API}?ecosystem=${ecosystem}&published=${since}..&per_page=100`,
    {
      headers,
      next: { revalidate: CACHE_TTL }  // 토큰 유무에 따라 60초 or 300초
    }
  );
  
  if (!response.ok) {
    console.error(`GitHub API error: ${response.status}`);
    return [];
  }
  
  const data = await response.json();
  return data.map(normalizeGitHubAdvisory);
}

// 모든 생태계 병렬 조회
export async function fetchAllEcosystems(dateRange: DateRange) {
  const ecosystems: Ecosystem[] = ['npm', 'pip', 'maven'];
  
  const results = await Promise.allSettled(
    ecosystems.map(eco => fetchGitHubAdvisories(eco, dateRange))
  );
  
  return {
    npm: results[0].status === 'fulfilled' ? results[0].value : [],
    pypi: results[1].status === 'fulfilled' ? results[1].value : [],
    maven: results[2].status === 'fulfilled' ? results[2].value : [],
  };
}
```

### 통합 데이터 수집

```typescript
// lib/sources/index.ts
export async function fetchAllVulnerabilities(
  sources: VulnSource[],
  dateRange: DateRange
): Promise<VulnResponse> {
  const fetchers: Record<VulnSource, () => Promise<Vulnerability[]>> = {
    nvd: () => fetchNVD(dateRange),
    cisa: () => fetchCISA(dateRange),
    github: () => fetchGitHubAdvisories('npm', dateRange), // GitHub 자체
    npm: () => fetchGitHubAdvisories('npm', dateRange),
    pypi: () => fetchGitHubAdvisories('pip', dateRange),
    maven: () => fetchGitHubAdvisories('maven', dateRange),
  };
  
  const results = await Promise.allSettled(
    sources.map(source => fetchers[source]())
  );
  
  const data: Vulnerability[] = [];
  const sourceCounts: Record<VulnSource, number> = {} as any;
  
  results.forEach((result, idx) => {
    const source = sources[idx];
    if (result.status === 'fulfilled') {
      data.push(...result.value);
      sourceCounts[source] = result.value.length;
    } else {
      console.error(`Failed to fetch ${source}:`, result.reason);
      sourceCounts[source] = 0;
    }
  });
  
  return {
    data: deduplicateByCVE(data),
    meta: {
      total: data.length,
      sources: sourceCounts,
      severities: countBySeverity(data),
      fetchedAt: new Date().toISOString()
    }
  };
}
```

## 주의사항

1. **GitHub Token 권장**: 토큰 있으면 캐싱 1분, 없으면 5분 (Rate Limit 60 req/hour 보호)
2. **CISA KEV Fallback**: 24시간 내 데이터 없으면 최근 5건 표시 (UI에 "최근 추가" 라벨)
3. **Rate Limit**: 외부 API 호출 시 반드시 캐싱 적용 (토큰 유무에 따라 TTL 조정)
4. **API 키 노출 금지**: 환경 변수로만 관리, 클라이언트에 노출 금지
5. **에러 메시지**: 사용자에게 기술적 세부사항 노출 금지
6. **한국어**: 모든 UI 텍스트 및 보고서는 한국어로
7. **접근성**: 적절한 contrast ratio 유지 (밤하늘 테마에서도)
8. **중복 제거**: 여러 소스에서 같은 CVE 가져올 수 있음 - deduplication 필수

## 참고 링크

- [NVD API 문서](https://nvd.nist.gov/developers/vulnerabilities)
- [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)
- [GitHub Advisory API](https://docs.github.com/en/rest/security-advisories/global-advisories)
- [GitHub Advisory Database](https://github.com/advisories)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference/messages_post)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS v4](https://tailwindcss.com/docs/v4-beta)
- [Vercel 배포 가이드](https://vercel.com/docs)

## Vercel 배포

### 배포 설정

```json
// vercel.json
{
  "framework": "nextjs",
  "regions": ["icn1"],  // 서울 리전 (한국 사용자 대상)
  "env": {
    "ANTHROPIC_API_KEY": "@anthropic-api-key",
    "NVD_API_KEY": "@nvd-api-key",
    "GITHUB_TOKEN": "@github-token"
  }
}
```

### 환경 변수 설정

Vercel Dashboard → Project → Settings → Environment Variables

| 변수명 | 환경 | 필수 | 설명 |
|--------|------|------|------|
| `ANTHROPIC_API_KEY` | Production, Preview | ✅ | Claude API 키 |
| `GITHUB_TOKEN` | Production, Preview | 권장 | Rate Limit 완화 + 캐싱 주기 단축 |
| `NVD_API_KEY` | Production, Preview | 권장 | NVD Rate Limit 완화 |

### 캐싱 전략 (Vercel 최적화)

```typescript
// API Route 캐싱 예시
// app/api/vulnerabilities/route.ts

export const revalidate = 300; // 5분 ISR

// 또는 동적 캐싱
export async function GET() {
  const data = await fetch(API_URL, {
    next: { revalidate: 300 }
  });
  
  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  });
}
```

### Edge Runtime (선택)

가벼운 API는 Edge Runtime으로 응답 속도 향상:

```typescript
// 취약점 조회 API - Edge 가능
export const runtime = 'edge';

// 보고서 생성 API - Node.js 필요 (Claude API 호출 시간)
export const runtime = 'nodejs';
export const maxDuration = 60; // Pro Plan: 최대 60초
```

### Vercel 함수 제한사항

| 항목 | Hobby (무료) | Pro |
|------|-------------|-----|
| 실행 시간 | 10초 | 60초 |
| 메모리 | 1024MB | 3008MB |
| 페이로드 | 4.5MB | 4.5MB |

**Claude 보고서 생성 시 주의:**
- Hobby 플랜: 10초 제한으로 타임아웃 가능
- Pro 플랜 권장 또는 스트리밍 응답 구현

### 스트리밍 응답 (타임아웃 방지)

```typescript
// app/api/report/generate/route.ts
import Anthropic from '@anthropic-ai/sdk';
import { ClaudeModel } from '@/lib/types';

const DEFAULT_MODEL: ClaudeModel = 'claude-sonnet-4-20250514';

export async function POST(req: Request) {
  const { sources, dateRange, reportType, model } = await req.json();
  
  // 모델 유효성 검사
  const selectedModel: ClaudeModel = [
    'claude-sonnet-4-20250514',
    'claude-opus-4-20250514', 
    'claude-haiku-3-5-20241022'
  ].includes(model) ? model : DEFAULT_MODEL;
  
  const anthropic = new Anthropic();
  
  const stream = await anthropic.messages.stream({
    model: selectedModel,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  });

  return new Response(stream.toReadableStream(), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Model-Used': selectedModel  // 사용된 모델 헤더로 전달
    }
  });
}
```

### 배포 체크리스트

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 로그인
vercel login

# 3. 프로젝트 연결
vercel link

# 4. 환경 변수 설정
vercel env add ANTHROPIC_API_KEY

# 5. 배포
vercel --prod
```

### 도메인 설정

1. Vercel Dashboard → Project → Settings → Domains
2. 커스텀 도메인 추가 (예: vuln.example.com)
3. DNS 설정:
   - CNAME: `cname.vercel-dns.com`
   - 또는 A: `76.76.21.21`

### 모니터링

- **Vercel Analytics**: 성능 모니터링 (무료)
- **Vercel Logs**: 실시간 로그 확인
- **Speed Insights**: Core Web Vitals 추적

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
   return (
           <html>
                   <body>
                           {children}
           <Analytics />
           <SpeedInsights />
           </body>
           </html>
   );
}
```