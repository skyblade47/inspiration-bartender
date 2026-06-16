import {
  LLMProvider,
  validateConfig,
  getDefaultModels,
  OpenAIConfig,
  AnthropicConfig,
  OllamaConfig,
} from '../../../src/services/llm/config';

describe('llm/config', () => {
  describe('LLMProvider', () => {
    it('应包含所有提供商枚举值', () => {
      expect(LLMProvider.OPENAI).toBe('openai');
      expect(LLMProvider.ANTHROPIC).toBe('anthropic');
      expect(LLMProvider.OLLAMA).toBe('ollama');
    });
  });

  describe('validateConfig', () => {
    it('OpenAI 配置需要 apiKey 和 model', () => {
      const validConfig: OpenAIConfig = {
        provider: LLMProvider.OPENAI,
        apiKey: 'test-key',
        model: 'gpt-4o',
      };
      expect(validateConfig(validConfig)).toBe(true);
    });

    it('OpenAI 配置缺少 apiKey 应返回 false', () => {
      const invalidConfig: OpenAIConfig = {
        provider: LLMProvider.OPENAI,
        apiKey: '',
        model: 'gpt-4o',
      };
      expect(validateConfig(invalidConfig)).toBe(false);
    });

    it('Anthropic 配置需要 apiKey 和 model', () => {
      const validConfig: AnthropicConfig = {
        provider: LLMProvider.ANTHROPIC,
        apiKey: 'test-key',
        model: 'claude-3-5-sonnet',
      };
      expect(validateConfig(validConfig)).toBe(true);
    });

    it('Ollama 配置需要 baseUrl 和 model', () => {
      const validConfig: OllamaConfig = {
        provider: LLMProvider.OLLAMA,
        baseUrl: 'http://localhost:11434',
        model: 'llama3',
      };
      expect(validateConfig(validConfig)).toBe(true);
    });

    it('Ollama 配置缺少 baseUrl 应返回 false', () => {
      const invalidConfig: OllamaConfig = {
        provider: LLMProvider.OLLAMA,
        baseUrl: '',
        model: 'llama3',
      };
      expect(validateConfig(invalidConfig)).toBe(false);
    });

    it('未知提供商应返回 false', () => {
      const unknownConfig = {
        provider: 'unknown',
        model: 'test',
      } as any;
      expect(validateConfig(unknownConfig)).toBe(false);
    });
  });

  describe('getDefaultModels', () => {
    it('OpenAI 应返回正确的模型列表', () => {
      const models = getDefaultModels(LLMProvider.OPENAI);
      expect(models).toContain('gpt-4o');
      expect(models).toContain('gpt-4o-mini');
    });

    it('Anthropic 应返回正确的模型列表', () => {
      const models = getDefaultModels(LLMProvider.ANTHROPIC);
      expect(models).toContain('claude-3-5-sonnet-20241022');
    });

    it('Ollama 应返回正确的模型列表', () => {
      const models = getDefaultModels(LLMProvider.OLLAMA);
      expect(models).toContain('llama3');
    });

    it('未知提供商应返回空数组', () => {
      const models = getDefaultModels('unknown' as LLMProvider);
      expect(models).toEqual([]);
    });
  });
});
