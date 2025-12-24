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

| 소스 | API/URL | 용도 |
|------|---------|------|
| NVD | `https://services.nvd.nist.gov/rest/json/cves/2.0` | 범용 CVE |
| CISA KEV | `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json` | 실제 악용 취약점 |
| GitHub Advisory | `https://api.github.com/advisories` | GitHub 생태계 |
| npm | `https://registry.npmjs.org/-/npm/v1/security/advisories` | npm 패키지 |
| PyPI (OSV) | `https://api.osv.dev/v1/query` | Python 패키지 |
| Maven (OSV) | `https://api.osv.dev/v1/query` | Java 패키지 |

### Rate Limit 주의
- **NVD**: API 키 없으면 5 req/30초, 있으면 50 req/30초
- **GitHub**: 인증 없으면 60 req/시간
- 반드시 캐싱 적용할 것

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
│   │   ├── ReportOptions.tsx   # 형식/기간/소스 선택
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
│   │   ├── cisa.ts             # CISA KEV 클라이언트
│   │   ├── github.ts           # GitHub Advisory 클라이언트
│   │   ├── npm.ts              # npm Advisory 클라이언트
│   │   └── osv.ts              # OSV API (PyPI, Maven)
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
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'unknown';
export type ReportType = 'summary' | 'detailed';
export type DateRange = '24h' | 'week' | 'month';  // 기본값: 24h

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
}

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
  "reportType": "summary"
}
```

**Response:**
```json
{
  "generatedAt": "2024-12-24T10:05:00Z",
  "dateRange": "24h",
  "reportType": "summary",
  "markdown": "# 보안 취약점 브리핑 (최근 24시간)\n\n## 요약\n...",
  "meta": {
    "totalVulnerabilities": 42,
    "sources": ["nvd", "cisa", "npm"]
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
- 우측 또는 하단: 심각도 차트
- 플로팅: "보고서 생성" 버튼
- 기간 필터: 24시간 (기본) / 1주일 / 1개월

### 2. 보고서 페이지 (`/report`)
- 좌측: 옵션 패널 (소스, 기간, 형식 선택)
- 우측: 보고서 뷰어 (마크다운 렌더링)
- 상단 우측: "마크다운 복사" 버튼
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

# 선택 (Rate Limit 완화)
NVD_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# 설정
CACHE_TTL=300                    # 캐시 유지 시간 (초)
DEFAULT_VULN_LIMIT=100           # 기본 조회 개수
```

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
- [ ] CISA 클라이언트 구현
- [ ] /api/vulnerabilities 엔드포인트
- [ ] 캐싱 적용

### Phase 3: 대시보드 UI (Day 2)
- [ ] 통계 카드
- [ ] 소스별 탭
- [ ] 취약점 목록
- [ ] 심각도 차트

### Phase 4: 보고서 생성 (Day 2-3)
- [ ] Claude API 연동
- [ ] 프롬프트 구현
- [ ] /api/report/generate 엔드포인트
- [ ] 보고서 뷰어 UI
- [ ] 마크다운 복사 기능

### Phase 5: 추가 소스 (Day 3)
- [ ] npm Advisory 연동
- [ ] OSV (PyPI, Maven) 연동
- [ ] GitHub Advisory 연동

### Phase 6: 마무리 (Day 3)
- [ ] 에러 처리 보강
- [ ] 로딩/스켈레톤 UI
- [ ] 반응형 점검
- [ ] Docker 설정

## 주의사항

1. **Rate Limit**: 외부 API 호출 시 반드시 캐싱 적용
2. **API 키 노출 금지**: 환경 변수로만 관리
3. **에러 메시지**: 사용자에게 기술적 세부사항 노출 금지
4. **한국어**: 모든 UI 텍스트 및 보고서는 한국어로
5. **접근성**: 적절한 contrast ratio 유지 (밤하늘 테마에서도)

## 참고 링크

- [NVD API 문서](https://nvd.nist.gov/developers/vulnerabilities)
- [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)
- [GitHub Advisory API](https://docs.github.com/en/rest/security-advisories)
- [OSV API](https://google.github.io/osv.dev/api/)
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

| 변수명 | 환경 | 설명 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | Production, Preview | Claude API 키 (필수) |
| `NVD_API_KEY` | Production, Preview | NVD API 키 (선택) |
| `GITHUB_TOKEN` | Production, Preview | GitHub 토큰 (선택) |

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

export async function POST(req: Request) {
  const { sources, dateRange, reportType } = await req.json();
  
  const anthropic = new Anthropic();
  
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  });

  return new Response(stream.toReadableStream(), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
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