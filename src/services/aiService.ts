// ─── LLM Provider Abstraction ───

import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';

export interface LLMProvider {
    generateContent(prompt: string): Promise<string>;
    streamContent(prompt: string): AsyncGenerator<string, void, unknown>;
}

// ─── Gemini Provider ───
class GeminiProvider implements LLMProvider {
    private ai: GoogleGenAI;
    private model: string;

    constructor() {
        if (!config.geminiApiKey) {
            throw new Error('GEMINI_API_KEY is missing in environment');
        }
        this.ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
        this.model = config.geminiModel;
    }

    async generateContent(prompt: string): Promise<string> {
        const response = await this.ai.models.generateContent({
            model: this.model,
            contents: prompt,
        });
        return response.text ?? '';
    }

    async *streamContent(prompt: string): AsyncGenerator<string, void, unknown> {
        const response = await this.ai.models.generateContentStream({
            model: this.model,
            contents: prompt,
        });
        for await (const chunk of response) {
            const text = chunk.text ?? '';
            if (text) {
                yield text;
            }
        }
    }
}

// ─── Claude Provider Stub (Future) ───
class ClaudeProvider implements LLMProvider {
    async generateContent(_prompt: string): Promise<string> {
        throw new Error('Claude provider not yet implemented');
    }
    async *streamContent(_prompt: string): AsyncGenerator<string, void, unknown> {
        throw new Error('Claude provider not yet implemented');
    }
}

// ─── Factory ───
export type ProviderName = 'gemini' | 'claude';

const providers: Record<ProviderName, () => LLMProvider> = {
    gemini: () => new GeminiProvider(),
    claude: () => new ClaudeProvider(),
};

let activeProvider: LLMProvider | null = null;
let activeProviderName: ProviderName = 'gemini';

export function getAIProvider(name?: ProviderName): LLMProvider {
    const providerName = name ?? activeProviderName;
    if (!activeProvider || providerName !== activeProviderName) {
        activeProvider = providers[providerName]();
        activeProviderName = providerName;
    }
    return activeProvider;
}

export function setActiveProvider(name: ProviderName): void {
    activeProviderName = name;
    activeProvider = null; // Will be re-created on next call
}
