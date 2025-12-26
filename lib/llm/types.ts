export type LLMProvider = 'claude' | 'openai' | 'gemini';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
}

export interface LLMStreamEvent {
  type: 'content' | 'done' | 'error';
  content?: string;
  error?: string;
}

export interface LLMProviderInfo {
  id: LLMProvider;
  name: string;
  description: string;
  model: string;
  keyPlaceholder: string;
}

export const LLM_PROVIDERS: Record<LLMProvider, LLMProviderInfo> = {
  claude: {
    id: 'claude',
    name: 'Claude',
    description: 'Anthropic Claude Sonnet 4',
    model: 'claude-sonnet-4-20250514',
    keyPlaceholder: 'sk-ant-api03-...',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o',
    model: 'gpt-4o',
    keyPlaceholder: 'sk-proj-...',
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    description: 'Google Gemini 2.0 Flash',
    model: 'gemini-2.0-flash-exp',
    keyPlaceholder: 'AIza...',
  },
};
