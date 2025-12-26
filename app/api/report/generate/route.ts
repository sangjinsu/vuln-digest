import { NextRequest } from 'next/server';
import { createLLMStream, LLMProvider } from '@/lib/llm';
import { getReportPrompt } from '@/lib/prompts';
import { fetchVulnerabilities } from '@/lib/sources';
import { VulnSource, DateRange, ReportType } from '@/lib/types';

// Vercel 함수 타임아웃 설정 (Pro: 60초)
export const maxDuration = 60;

// 유효한 값 검증
const VALID_SOURCES: VulnSource[] = ['nvd', 'kisa', 'github'];
const VALID_DATE_RANGES: DateRange[] = ['24h', 'week', 'month'];
const VALID_REPORT_TYPES: ReportType[] = ['summary', 'detailed'];
const VALID_LLM_PROVIDERS: LLMProvider[] = ['claude', 'openai', 'gemini'];

interface ValidatedRequest {
  sources: VulnSource[];
  dateRange: DateRange;
  reportType: ReportType;
  llm: {
    provider: LLMProvider;
    model?: string;
    apiKey: string;
  };
}

function validateRequest(body: unknown): ValidatedRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  const { sources, dateRange, reportType, llm } = body as Record<string, unknown>;

  // sources 검증
  const validSources: VulnSource[] = Array.isArray(sources)
    ? sources.filter((s): s is VulnSource => VALID_SOURCES.includes(s as VulnSource))
    : ['nvd', 'kisa'];

  // dateRange 검증
  const validDateRange = VALID_DATE_RANGES.includes(dateRange as DateRange)
    ? (dateRange as DateRange)
    : '24h';

  // reportType 검증
  const validReportType = VALID_REPORT_TYPES.includes(reportType as ReportType)
    ? (reportType as ReportType)
    : 'summary';

  // LLM 설정 검증
  if (!llm || typeof llm !== 'object') {
    throw new Error('LLM 설정이 필요합니다');
  }

  const { provider, model, apiKey } = llm as Record<string, unknown>;

  if (!VALID_LLM_PROVIDERS.includes(provider as LLMProvider)) {
    throw new Error('지원하지 않는 LLM입니다');
  }

  if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 10) {
    throw new Error('유효한 API 키가 필요합니다');
  }

  return {
    sources: validSources,
    dateRange: validDateRange,
    reportType: validReportType,
    llm: {
      provider: provider as LLMProvider,
      model: typeof model === 'string' ? model : undefined,
      apiKey: apiKey as string,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sources, dateRange, reportType, llm } = validateRequest(body);

    // 취약점 데이터 조회
    const vulnResponse = await fetchVulnerabilities({
      sources,
      dateRange,
      limit: 50,
    });

    // 프롬프트 생성
    const prompt = getReportPrompt(vulnResponse.data, reportType, dateRange);

    // LLM 스트리밍 호출 (통합 인터페이스)
    const stream = createLLMStream(llm.provider, llm.apiKey, prompt, 4096, llm.model);

    // SSE 스트림 생성
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content') {
              const data = JSON.stringify({ content: event.content });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } else if (event.type === 'error') {
              const data = JSON.stringify({ error: event.error });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              break;
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
    const message = error instanceof Error ? error.message : '보고서 생성에 실패했습니다';
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
