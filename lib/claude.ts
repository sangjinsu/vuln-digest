import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface GenerateReportParams {
  prompt: string;
  maxTokens?: number;
}

/**
 * Claude API를 사용하여 보고서 생성 (스트리밍)
 */
export async function generateReportStream(params: GenerateReportParams) {
  const { prompt, maxTokens = 4096 } = params;

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return stream;
}

/**
 * Claude API를 사용하여 보고서 생성 (일반)
 */
export async function generateReport(params: GenerateReportParams): Promise<string> {
  const { prompt, maxTokens = 4096 } = params;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const textContent = message.content.find((block) => block.type === 'text');
  return textContent?.type === 'text' ? textContent.text : '';
}

export { anthropic };
