# VulnDigest - 보안 취약점 모니터링 서비스

## 프로젝트 개요

AI가 정리해주는 보안 취약점 브리핑 서비스. 여러 보안 취약점 소스에서 데이터를 수집하고, 다양한 LLM(Claude, OpenAI, Gemini)을 활용해 한국어 보고서를 생성하는 웹 애플리케이션.

### 핵심 가치
- 실시간 취약점 조회 (DB 저장 없음)
- 다중 LLM 지원 (Claude, OpenAI, Gemini)
- 한국어 보고서 자동 생성
- 마크다운 형식 보고서 복사 지원
- 밤하늘 테마 UI

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | Next.js 16.0.10 (App Router) |
| 언어 | TypeScript (strict mode) |
| 스타일링 | Tailwind CSS v4 |
| UI 컴포넌트 | 커스텀 컴포넌트 (Tailwind v4 네이티브) |
| AI | Claude, OpenAI GPT, Google Gemini |
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
   │ 취약점   │        │ LLM      │
   │ APIs     │        │ APIs     │
   │ (NVD,    │        │ (Claude, │
   │  KISA,   │        │  OpenAI, │
   │  GitHub) │        │  Gemini) │
   └──────────┘        └──────────┘
```

### 핵심 원칙
- **No Database**: 취약점 데이터 저장 없음, 실시간 조회
- **24시간 기본**: 화면 접속 시 최근 24시간 내 취약점만 기본 표시
- **캐싱**: Next.js fetch 캐시 활용 (revalidate: 300초)
- **Server Components 우선**: 클라이언트 컴포넌트 최소화
- **클라이언트 API 키**: 사용자가 직접 API 키 입력 (서버 저장 없음)

## 데이터 소스

| 소스 | API/URL | 용도 | 비고 |
|------|---------|------|------|
| NVD | `https://services.nvd.nist.gov/rest/json/cves/2.0` | 범용 CVE | API 키 권장 |
| KISA 보안공지 | `https://www.boho.or.kr/kr/rss.do?bbsId=B0000133` | 한국 보안공지 | RSS 피드 |
| GitHub Advisory | `https://api.github.com/advisories` | GitHub + 모든 생태계 통합 | Token 권장 |

### KISA 보안공지

한국인터넷진흥원(KISA)에서 제공하는 보안공지 RSS 피드:
- 국내 보안 이슈에 특화
- RSS 형식으로 제공 (XML)
- CVSS 점수 없음 (severity: 'unknown')

```typescript
// lib/sources/kisa.ts
const KISA_RSS_URL = 'https://www.boho.or.kr/kr/rss.do?bbsId=B0000133';

// RSS에서 파싱되는 필드
interface RSSItem {
  title: string;    // 보안공지 제목
  link: string;     // 상세 페이지 URL (nttId 포함)
  pubDate: string;  // 발행일 (YYYY-MM-DD)
}
```

### GitHub Advisory

GitHub Security Advisory API로 모든 생태계의 취약점을 통합 조회:
- npm, PyPI, Maven, Go, RubyGems, Rust 등 모든 생태계 지원
- GHSA ID로 고유 식별
- CVSS 점수 및 영향받는 패키지 정보 포함

### Rate Limit 주의

| 소스 | 인증 없음 | 인증 있음 |
|------|----------|----------|
| **NVD** | 5 req/30초 | 50 req/30초 (API 키) |
| **GitHub** | 60 req/시간 | **5,000 req/시간** (Token) |
| **KISA** | 제한 없음 | - |

### 캐싱 전략 (토큰 유무에 따라)

```typescript
// lib/utils/cache.ts
// 토큰 있음: 1분 캐싱 (더 실시간)
// 토큰 없음: 5분 캐싱 (Rate Limit 보호)
export const CACHE_TTL = process.env.GITHUB_TOKEN ? 60 : 300;
```

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
│               └── route.ts    # 보고서 생성 API (스트리밍)
├── components/
│   ├── dashboard/
│   │   ├── Dashboard.tsx       # 메인 대시보드 컴포넌트
│   │   ├── SourceTabs.tsx      # 소스별 탭 (전체/GitHub/KISA/NVD)
│   │   ├── VulnList.tsx        # 취약점 목록
│   │   ├── VulnCard.tsx        # 개별 취약점 카드
│   │   ├── DateRangePicker.tsx # 기간 선택 (24h/week/month)
│   │   ├── SeverityFilter.tsx  # 심각도 필터
│   │   ├── SearchInput.tsx     # 검색 입력
│   │   └── StatsCards.tsx      # 통계 카드
│   ├── report/
│   │   ├── ReportViewer.tsx    # 마크다운 렌더링
│   │   ├── ReportOptions.tsx   # LLM/소스/기간/형식 선택
│   │   └── CopyButton.tsx      # 마크다운 복사 버튼
│   └── layout/
│       └── Header.tsx          # 상단 네비게이션
├── lib/
│   ├── sources/
│   │   ├── index.ts            # 통합 인터페이스
│   │   ├── nvd.ts              # NVD API 클라이언트
│   │   ├── kisa.ts             # KISA RSS 클라이언트
│   │   ├── github.ts           # GitHub Advisory 클라이언트
│   │   └── types.ts            # 소스 관련 타입
│   ├── llm/
│   │   ├── index.ts            # LLM export
│   │   ├── providers.ts        # LLM 스트리밍 구현 (Claude, OpenAI, Gemini)
│   │   └── types.ts            # LLM 타입 정의
│   ├── utils/
│   │   ├── cache.ts            # 캐시 유틸리티
│   │   └── date.ts             # 날짜 유틸리티
│   ├── prompts.ts              # 보고서 생성 프롬프트
│   └── types.ts                # TypeScript 타입 정의
├── .env.local                  # 환경 변수 (gitignore)
├── next.config.ts              # Next.js 설정
├── postcss.config.mjs          # PostCSS 설정 (Tailwind v4)
└── package.json
```

## 타입 정의

```typescript
// lib/types.ts

// 취약점 소스 타입 (3개)
export type VulnSource = 'nvd' | 'kisa' | 'github';

// 심각도 타입
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'unknown';

// 보고서 타입
export type ReportType = 'summary' | 'detailed';

// 기간 범위 타입
export type DateRange = '24h' | 'week' | 'month';  // 기본값: 24h

// 취약점 인터페이스
export interface Vulnerability {
  id: string;                    // CVE-2024-XXXX, GHSA-xxxx, KISA-xxxxx
  source: VulnSource;
  severity: Severity;
  cvssScore?: number;
  title: string;
  description: string;
  affectedProducts: string[];
  publishedAt: string;           // ISO 8601
  url: string;                   // 원본 링크
  _fallback?: boolean;           // fallback 데이터 여부
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
  kisa: {
    id: 'kisa',
    name: 'KISA 보안공지',
    description: '한국인터넷진흥원 보안공지',
    url: 'https://www.boho.or.kr/kr/bbs/list.do?menuNo=205020&bbsId=B0000133',
  },
  github: {
    id: 'github',
    name: 'GitHub Advisory',
    description: 'GitHub Security Advisories',
    url: 'https://github.com/advisories',
  },
};

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

// 심각도별 색상 매핑 (Tailwind 클래스)
export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: 'bg-severity-critical',
  high: 'bg-severity-high',
  medium: 'bg-severity-medium',
  low: 'bg-severity-low',
  unknown: 'bg-text-muted',
};
```

```typescript
// lib/llm/types.ts

// LLM Provider 타입
export type LLMProvider = 'claude' | 'openai' | 'gemini';

// LLM 설정
export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model?: string;
}

// LLM 스트림 이벤트
export interface LLMStreamEvent {
  type: 'content' | 'done' | 'error';
  content?: string;
  error?: string;
}

// 모델 정보
export interface ModelInfo {
  id: string;
  name: string;
  description: string;
}

// Provider 정보
export interface LLMProviderInfo {
  id: LLMProvider;
  name: string;
  description: string;
  defaultModel: string;
  keyPlaceholder: string;
}

// Provider별 모델 목록
export const LLM_MODELS: Record<LLMProvider, ModelInfo[]> = {
  claude: [
    { id: 'claude-sonnet-4-20250514', name: 'Sonnet 4', description: '균형 잡힌 성능 (기본)' },
    { id: 'claude-opus-4-20250514', name: 'Opus 4', description: '최고 품질, 복잡한 분석' },
    { id: 'claude-haiku-3-5-20241022', name: 'Haiku 3.5', description: '빠른 응답, 비용 절약' },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', description: '최신 멀티모달 (기본)' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '빠른 응답, 비용 절약' },
  ],
  gemini: [
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', description: '빠른 응답 (기본)' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: '고품질 분석' },
  ],
};

// Provider 정보 상수
export const LLM_PROVIDERS: Record<LLMProvider, LLMProviderInfo> = {
  claude: {
    id: 'claude',
    name: 'Claude',
    description: 'Anthropic Claude',
    defaultModel: 'claude-sonnet-4-20250514',
    keyPlaceholder: 'sk-ant-api03-...',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'OpenAI GPT',
    defaultModel: 'gpt-4o',
    keyPlaceholder: 'sk-proj-...',
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    description: 'Google Gemini',
    defaultModel: 'gemini-2.0-flash-exp',
    keyPlaceholder: 'AIza...',
  },
};

// 기본 모델 가져오기
export function getDefaultModel(provider: LLMProvider): string {
  return LLM_PROVIDERS[provider].defaultModel;
}
```

## API 명세

### GET /api/vulnerabilities

취약점 목록 조회 (캐시: 5분)

**Query Parameters:**
| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| sources | string | 전체 | 콤마 구분 (nvd,kisa,github) |
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
    },
    {
      "id": "KISA-12345",
      "source": "kisa",
      "severity": "unknown",
      "title": "보안 취약점 주의 안내",
      "description": "...",
      "affectedProducts": [],
      "publishedAt": "2024-12-24T00:00:00Z",
      "url": "https://www.boho.or.kr/..."
    }
  ],
  "meta": {
    "total": 42,
    "sources": { "nvd": 20, "kisa": 5, "github": 17 },
    "severities": { "critical": 3, "high": 15, "medium": 20, "low": 4, "unknown": 5 },
    "fetchedAt": "2024-12-24T10:00:00Z"
  }
}
```

### POST /api/report/generate

LLM API로 보고서 생성 (SSE 스트리밍)

**Request Body:**
```json
{
  "sources": ["nvd", "kisa", "github"],
  "dateRange": "24h",
  "reportType": "summary",
  "llm": {
    "provider": "claude",
    "model": "claude-sonnet-4-20250514",
    "apiKey": "sk-ant-api03-..."
  }
}
```

**LLM Provider 옵션:**
| Provider | 모델 | 설명 | 용도 |
|----------|------|------|------|
| claude | claude-sonnet-4-20250514 | Sonnet 4 (기본) | 일반 보고서 |
| claude | claude-opus-4-20250514 | Opus 4 | 심층 분석 |
| claude | claude-haiku-3-5-20241022 | Haiku 3.5 | 빠른 요약 |
| openai | gpt-4o | GPT-4o (기본) | 일반 보고서 |
| openai | gpt-4o-mini | GPT-4o Mini | 빠른 요약 |
| gemini | gemini-2.0-flash-exp | Gemini 2.0 Flash (기본) | 빠른 응답 |
| gemini | gemini-1.5-pro | Gemini 1.5 Pro | 고품질 분석 |

**Response (SSE Stream):**
```
data: {"content": "# 보안 취약점 브리핑..."}

data: {"content": "## 요약\n..."}

data: [DONE]
```

**에러 Response:**
```json
{
  "error": "유효한 API 키가 필요합니다"
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
- **아이콘**: Lucide React 사용
- **폰트**: Inter 또는 시스템 폰트
- **Severity 'unknown'**: 배지 숨김 처리

### 반응형 브레이크포인트
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 주요 화면

### 1. 메인 대시보드 (`/`)
- 상단: 통계 카드 (Critical/High 수, 전체 수, 마지막 업데이트)
- 중단: 소스별 탭 + 취약점 목록 **(기본: 24시간 내 취약점만 표시)**
   - 탭: 전체 | GitHub | KISA | NVD (순서)
   - 심각도 필터, 검색 입력
- 기간 필터: 24시간 (기본) / 1주일 / 1개월

### 2. 보고서 페이지 (`/report`)
- 좌측: 옵션 패널
   - **AI Provider 선택** (Claude / OpenAI / Gemini)
   - **모델 선택** (Provider별 모델 목록)
   - **API 키 입력** (마스킹 처리, 서버 저장 없음)
   - 소스 선택 (GitHub, KISA, NVD)
   - 기간 선택 (24시간, 1주일, 1개월)
   - 형식 선택 (요약/상세)
- 우측: 보고서 뷰어 (마크다운 렌더링, 스트리밍 표시)
- 상단 우측: "마크다운 복사" 버튼
- 생성 중: 로딩 스피너 + 스트리밍 표시

## 보고서 프롬프트

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
- 취약점이 없으면 "선택한 기간에 새로운 취약점이 발견되지 않았습니다"라고 명시
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
- 취약점이 없으면 "선택한 기간에 새로운 취약점이 발견되지 않았습니다"라고 명시
```

## 환경 변수

```bash
# .env.local

# 권장 (Rate Limit 완화 + 캐싱 주기 단축)
GITHUB_TOKEN=ghp_xxxxxxxxxxxx    # GitHub Advisory API
NVD_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# 설정
CACHE_TTL=300                    # 캐시 유지 시간 (초) - 토큰 있으면 60으로 단축

# 참고: LLM API 키는 클라이언트에서 직접 입력
# ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_AI_API_KEY 등은 서버에 저장하지 않음
```

### GitHub Token 효과

| 항목 | 토큰 없음 | 토큰 있음 |
|------|----------|----------|
| Rate Limit | 60 req/hour | **5,000 req/hour** |
| 캐싱 주기 | 5분 (필수) | **1분 가능** |
| 안정성 | Rate Limit 에러 가능 | 거의 무제한 |

### LLM Provider 비교

| Provider | 모델 | 속도 | 품질 | 비용 |
|----------|------|------|------|------|
| **Claude** | Haiku 3.5 | ⚡ 매우 빠름 | 보통 | 💰 저렴 |
| **Claude** | Sonnet 4 | 빠름 | 좋음 | 💰💰 중간 |
| **Claude** | Opus 4 | 보통 | 최고 | 💰💰💰 높음 |
| **OpenAI** | GPT-4o Mini | ⚡ 빠름 | 보통 | 💰 저렴 |
| **OpenAI** | GPT-4o | 빠름 | 좋음 | 💰💰 중간 |
| **Gemini** | 2.0 Flash | ⚡ 매우 빠름 | 보통 | 💰 저렴 |
| **Gemini** | 1.5 Pro | 보통 | 좋음 | 💰💰 중간 |

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
    "@anthropic-ai/sdk": "^0.71.2",
    "@google/generative-ai": "^0.24.1",
    "openai": "^6.15.0",
    "lucide-react": "^0.468.0",
    "react-markdown": "^10.1.0",
    "remark-gfm": "^4.0.1"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0"
  }
}
```

### Next.js 16 설정

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {},
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

### Phase 1: 기본 구조 (Day 1) ✅
- [x] 프로젝트 셋업
- [x] 밤하늘 테마 적용 (globals.css)
- [x] 기본 레이아웃 (Header, 메인 구조)
- [x] 타입 정의

### Phase 2: 데이터 수집 (Day 1-2) ✅
- [x] NVD 클라이언트 구현
- [x] KISA 클라이언트 구현 (RSS 파싱)
- [x] GitHub Advisory 클라이언트
- [x] /api/vulnerabilities 엔드포인트
- [x] 캐싱 적용

### Phase 3: 대시보드 UI (Day 2) ✅
- [x] 통계 카드
- [x] 소스별 탭 (전체/GitHub/KISA/NVD)
- [x] 취약점 목록
- [x] 심각도 필터
- [x] 검색 기능

### Phase 4: 보고서 생성 (Day 2-3) ✅
- [x] 다중 LLM API 연동 (Claude, OpenAI, Gemini)
- [x] 프롬프트 구현
- [x] /api/report/generate 엔드포인트 (스트리밍)
- [x] 보고서 뷰어 UI
- [x] 마크다운 복사 기능

### Phase 5: 마무리 (Day 3) ✅
- [x] 에러 처리 보강
- [x] 로딩/스켈레톤 UI
- [x] 반응형 점검
- [x] 빈 상태 UI (데이터 없을 때)

## 데이터 수집 로직

### KISA 보안공지 - RSS 파싱

```typescript
// lib/sources/kisa.ts
const KISA_RSS_URL = 'https://www.boho.or.kr/kr/rss.do?bbsId=B0000133';

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
}

function parseRSSItems(xml: string): RSSItem[] {
  // XML에서 <item> 태그 파싱
  // title, link, pubDate 추출
}

function extractNttId(link: string): string {
  // link에서 nttId 파라미터 추출
  const match = link.match(/nttId=(\d+)/);
  return match?.[1] || '';
}

export async function fetchKISAVulnerabilities(params: VulnQueryParams): Promise<Vulnerability[]> {
  const response = await fetch(KISA_RSS_URL, {
    headers: { Accept: 'application/rss+xml' },
    next: { revalidate: 300 },
  });

  const xml = await response.text();
  const items = parseRSSItems(xml);

  return items.map(item => ({
    id: `KISA-${extractNttId(item.link)}`,
    source: 'kisa',
    severity: 'unknown',  // RSS에서는 심각도 정보 없음
    title: item.title,
    description: item.title,
    affectedProducts: [],
    publishedAt: parseKISADate(item.pubDate),
    url: item.link,
  }));
}
```

### GitHub Advisory - 통합 조회

```typescript
// lib/sources/github.ts
const GITHUB_API_URL = 'https://api.github.com/advisories';

export async function fetchGitHubVulnerabilities(params: VulnQueryParams): Promise<Vulnerability[]> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(`${GITHUB_API_URL}?per_page=100`, {
    headers,
    next: { revalidate: CACHE_TTL },
  });

  const data = await response.json();

  return data.map(transformGitHubAdvisory);
}
```

### 통합 데이터 수집

```typescript
// lib/sources/index.ts
const SOURCE_FETCHERS: Partial<Record<VulnSource, SourceFetcher>> = {
  nvd: fetchNVDVulnerabilities,
  kisa: fetchKISAVulnerabilities,
  github: fetchGitHubVulnerabilities,
};

export async function fetchVulnerabilities(params: VulnQueryParams): Promise<VulnResponse> {
  const { sources = ['nvd', 'kisa', 'github'] } = params;

  // 소스별 병렬 호출
  const results = await Promise.allSettled(
    sources.map(source => SOURCE_FETCHERS[source]?.(params) ?? Promise.resolve([]))
  );

  // 결과 병합 및 정렬
  const allVulnerabilities = results
    .filter((r): r is PromiseFulfilledResult<Vulnerability[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return {
    data: allVulnerabilities,
    meta: {
      total: allVulnerabilities.length,
      sources: countBySources(allVulnerabilities),
      severities: countBySeverities(allVulnerabilities),
      fetchedAt: new Date().toISOString(),
    },
  };
}
```

## 주의사항

1. **GitHub Token 권장**: 토큰 있으면 캐싱 1분, 없으면 5분 (Rate Limit 60 req/hour 보호)
2. **KISA RSS**: 심각도 정보 없음 (severity: 'unknown'), UI에서 배지 숨김 처리
3. **Rate Limit**: 외부 API 호출 시 반드시 캐싱 적용
4. **API 키 보안**: 클라이언트 입력 방식, 서버 저장 없음, 요청마다 전송
5. **에러 메시지**: 사용자에게 기술적 세부사항 노출 금지
6. **한국어**: 모든 UI 텍스트 및 보고서는 한국어로
7. **접근성**: 적절한 contrast ratio 유지 (밤하늘 테마에서도)

## 참고 링크

- [NVD API 문서](https://nvd.nist.gov/developers/vulnerabilities)
- [KISA 보안공지](https://www.boho.or.kr/kr/bbs/list.do?menuNo=205020&bbsId=B0000133)
- [GitHub Advisory API](https://docs.github.com/en/rest/security-advisories/global-advisories)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference/messages_post)
- [OpenAI API](https://platform.openai.com/docs/api-reference)
- [Google Gemini API](https://ai.google.dev/api)
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
    "NVD_API_KEY": "@nvd-api-key",
    "GITHUB_TOKEN": "@github-token"
  }
}
```

### 환경 변수 설정

Vercel Dashboard → Project → Settings → Environment Variables

| 변수명 | 환경 | 필수 | 설명 |
|--------|------|------|------|
| `GITHUB_TOKEN` | Production, Preview | 권장 | Rate Limit 완화 + 캐싱 주기 단축 |
| `NVD_API_KEY` | Production, Preview | 권장 | NVD Rate Limit 완화 |

### Vercel 함수 제한사항

| 항목 | Hobby (무료) | Pro |
|------|-------------|-----|
| 실행 시간 | 10초 | 60초 |
| 메모리 | 1024MB | 3008MB |
| 페이로드 | 4.5MB | 4.5MB |

**LLM 보고서 생성 시 주의:**
- Hobby 플랜: 10초 제한으로 타임아웃 가능
- Pro 플랜 권장 또는 스트리밍 응답 구현 (현재 구현됨)

### 배포 체크리스트

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 로그인
vercel login

# 3. 프로젝트 연결
vercel link

# 4. 환경 변수 설정
vercel env add GITHUB_TOKEN

# 5. 배포
vercel --prod
```
