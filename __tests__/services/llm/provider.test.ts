import { LLMService, MessageRole, createProvider } from '../../../src/services/llm/provider';
import { LLMProvider, OpenAIConfig, AnthropicConfig, OllamaConfig } from '../../../src/services/llm/config';

describe('llm/provider', () => {
  describe('createProvider', () => {
    it('应创建 OpenAI provider', () => {
      const config: OpenAIConfig = {
        provider: LLMProvider.OPENAI,
        apiKey: 'test-key',
        model: 'gpt-4o',
      };
      const provider = createProvider(config);
      expect(provider).toBeDefined();
    });

    it('应创建 Anthropic provider', () => {
      const config: AnthropicConfig = {
        provider: LLMProvider.ANTHROPIC,
        apiKey: 'test-key',
        model: 'claude-3-5-sonnet',
      };
      const provider = createProvider(config);
      expect(provider).toBeDefined();
    });

    it('应创建 Ollama provider', () => {
      const config: OllamaConfig = {
        provider: LLMProvider.OLLAMA,
        baseUrl: 'http://localhost:11434',
        model: 'llama3',
      };
      const provider = createProvider(config);
      expect(provider).toBeDefined();
    });

    it('未知提供商应抛出错误', () => {
      const config = { provider: 'unknown' } as any;
      expect(() => createProvider(config)).toThrow('不支持的 LLM 提供商');
    });
  });

  describe('LLMService', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockClear();
    });

    it('应创建 LLMService 实例', () => {
      const config: OpenAIConfig = {
        provider: LLMProvider.OPENAI,
        apiKey: 'test-key',
        model: 'gpt-4o',
      };
      const service = new LLMService(config);
      expect(service).toBeDefined();
    });

    it('getConfig 应返回当前配置', () => {
      const config: OpenAIConfig = {
        provider: LLMProvider.OPENAI,
        apiKey: 'test-key',
        model: 'gpt-4o',
      };
      const service = new LLMService(config);
      expect(service.getConfig()).toEqual(config);
    });

    it('ask 方法应返回响应内容', async () => {
      const config: OpenAIConfig = {
        provider: LLMProvider.OPENAI,
        apiKey: 'test-key',
        model: 'gpt-4o',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '测试响应' } }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
      });

      const service = new LLMService(config);
      const response = await service.ask('你好');

      expect(response).toBe('测试响应');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('chat 方法应正确处理响应', async () => {
      const config: OpenAIConfig = {
        provider: LLMProvider.OPENAI,
        apiKey: 'test-key',
        model: 'gpt-4o',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '响应内容' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
      });

      const service = new LLMService(config);
      const response = await service.chat({
        messages: [{ role: MessageRole.USER, content: '你好' }],
      });

      expect(response.content).toBe('响应内容');
      expect(response.usage).toBeDefined();
      expect(response.finishReason).toBe('stop');
    });
  });

  describe('MessageRole', () => {
    it('应包含所有消息角色', () => {
      expect(MessageRole.SYSTEM).toBe('system');
      expect(MessageRole.USER).toBe('user');
      expect(MessageRole.ASSISTANT).toBe('assistant');
    });
  });
});
