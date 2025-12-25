import { Vulnerability, ReportType, DateRange } from './types';

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  '24h': '최근 24시간',
  week: '최근 1주일',
  month: '최근 1개월',
};

/**
 * 요약형 보고서 프롬프트
 */
function getSummaryPrompt(vulnerabilities: Vulnerability[], dateRange: DateRange): string {
  const dateLabel = DATE_RANGE_LABELS[dateRange];
  const vulnData = JSON.stringify(vulnerabilities, null, 2);

  return `당신은 보안 전문가입니다. 다음 취약점 데이터를 분석하여 한국어로 간결한 보고서를 작성해주세요.

## 보고서 형식
- 제목: "보안 취약점 브리핑 - ${dateLabel}"
- 핵심 요약: 3-5문장
- 주요 취약점: Critical/High만 bullet point로
- 영향받는 주요 제품/패키지
- 권장 조치사항

## 작성 원칙
- 기술적이지만 이해하기 쉽게
- 구체적인 CVE ID 포함
- 마크다운 형식 사용
- 취약점이 없으면 "선택한 기간에 새로운 취약점이 발견되지 않았습니다"라고 명시

## 취약점 데이터
${vulnData}`;
}

/**
 * 상세형 보고서 프롬프트
 */
function getDetailedPrompt(vulnerabilities: Vulnerability[], dateRange: DateRange): string {
  const dateLabel = DATE_RANGE_LABELS[dateRange];
  const vulnData = JSON.stringify(vulnerabilities, null, 2);

  return `당신은 보안 전문가입니다. 다음 취약점 데이터를 분석하여 한국어로 상세한 보고서를 작성해주세요.

## 보고서 형식
- 제목: "보안 취약점 상세 보고서 - ${dateLabel}"
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

## 취약점 데이터
${vulnData}`;
}

/**
 * 보고서 타입에 따른 프롬프트 생성
 */
export function getReportPrompt(
  vulnerabilities: Vulnerability[],
  reportType: ReportType,
  dateRange: DateRange
): string {
  if (reportType === 'summary') {
    return getSummaryPrompt(vulnerabilities, dateRange);
  }
  return getDetailedPrompt(vulnerabilities, dateRange);
}
