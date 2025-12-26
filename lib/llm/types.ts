export type LLMProvider = 'claude' | 'openai' | 'gemini';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model?: string;
}

export interface LLMStreamEvent {
  type: 'content' | 'done' | 'error';
  content?: string;
  error?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
}

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
