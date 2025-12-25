import { NextRequest } from 'next/server';
import { generateReportStream } from '@/lib/claude';
import { getReportPrompt } from '@/lib/prompts';
import { fetchVulnerabilities } from '@/lib/sources';
import { ReportRequest, VulnSource, DateRange, ReportType } from '@/lib/types';

// Vercel 함수 타임아웃 설정 (Pro: 60초)
export const maxDuration = 60;

// 유효한 값 검증
const VALID_SOURCES: VulnSource[] = ['nvd', 'cisa', 'github', 'npm', 'pypi', 'maven'];
const VALID_DATE_RANGES: DateRange[] = ['24h', 'week', 'month'];
const VALID_REPORT_TYPES: ReportType[] = ['summary', 'detailed'];

function validateRequest(body: unknown): ReportRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  const { sources, dateRange, reportType } = body as Record<string, unknown>;

  // sources 검증
  const validSources: VulnSource[] = Array.isArray(sources)
    ? sources.filter((s): s is VulnSource => VALID_SOURCES.includes(s as VulnSource))
    : ['nvd', 'cisa'];

  // dateRange 검증
  const validDateRange = VALID_DATE_RANGES.includes(dateRange as DateRange)
    ? (dateRange as DateRange)
    : '24h';

  // reportType 검증
  const validReportType = VALID_REPORT_TYPES.includes(reportType as ReportType)
    ? (reportType as ReportType)
    : 'summary';

  return {
    sources: validSources,
    dateRange: validDateRange,
    reportType: validReportType,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sources, dateRange, reportType } = validateRequest(body);

    // 취약점 데이터 조회
    const vulnResponse = await fetchVulnerabilities({
      sources,
      dateRange,
      limit: 50,
    });

    // 프롬프트 생성
    const prompt = getReportPrompt(vulnResponse.data, reportType, dateRange);

    // Claude API 스트리밍 호출
    const stream = await generateReportStream({ prompt });

    // SSE 스트림 생성
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const data = JSON.stringify({ content: event.delta.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return Response.json(
      { error: '보고서 생성에 실패했습니다' },
      { status: 500 }
    );
  }
}
