import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, LLMStreamEvent, getDefaultModel } from './types';

export async function* createLLMStream(
  provider: LLMProvider,
  apiKey: string,
  prompt: string,
  maxTokens: number = 4096,
  model?: string
): AsyncGenerator<LLMStreamEvent> {
  const selectedModel = model || getDefaultModel(provider);

  switch (provider) {
    case 'claude':
      yield* claudeStream(apiKey, prompt, maxTokens, selectedModel);
      break;
    case 'openai':
      yield* openaiStream(apiKey, prompt, maxTokens, selectedModel);
      break;
    case 'gemini':
      yield* geminiStream(apiKey, prompt, selectedModel);
      break;
    default:
      yield { type: 'error', error: `지원하지 않는 LLM: ${provider}` };
  }
}

async function* claudeStream(
  apiKey: string,
  prompt: string,
  maxTokens: number,
  model: string
): AsyncGenerator<LLMStreamEvent> {
  try {
    const anthropic = new Anthropic({ apiKey });
    const stream = await anthropic.messages.stream({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield { type: 'content', content: event.delta.text };
      }
    }
    yield { type: 'done' };
  } catch (error) {
    yield { type: 'error', error: getErrorMessage(error) };
  }
}

async function* openaiStream(
  apiKey: string,
  prompt: string,
  maxTokens: number,
  model: string
): AsyncGenerator<LLMStreamEvent> {
  try {
    const openai = new OpenAI({ apiKey });
    const stream = await openai.chat.completions.create({
      model,
      max_tokens: maxTokens,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield { type: 'content', content };
      }
    }
    yield { type: 'done' };
  } catch (error) {
    yield { type: 'error', error: getErrorMessage(error) };
  }
}

async function* geminiStream(
  apiKey: string,
  prompt: string,
  modelId: string
): AsyncGenerator<LLMStreamEvent> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelId,
    });
    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield { type: 'content', content: text };
      }
    }
    yield { type: 'done' };
  } catch (error) {
    yield { type: 'error', error: getErrorMessage(error) };
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (
      error.message.includes('401') ||
      error.message.includes('Unauthorized') ||
      error.message.includes('invalid_api_key')
    ) {
      return 'API 키가 유효하지 않습니다';
    }
    if (error.message.includes('429') || error.message.includes('rate')) {
      return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요';
    }
    return error.message;
  }
  return '알 수 없는 오류가 발생했습니다';
}
