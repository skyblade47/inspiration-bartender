import { LLMService, MessageRole, createProvider, ModelInfo } from '../../../src/services/llm/provider';
import {
  LLMProvider,
  OpenAIConfig,
  AnthropicConfig,
  OllamaConfig,
  GeminiConfig,
  DeepSeekConfig,
  MoonshotConfig,
  QwenConfig,
  CustomConfig,
} from '../../../src/services/llm/config';

describe('llm/provider', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe('createProvider', () => {
    it('应创建 OpenAI provider', () => {
      const config: OpenAIConfig = {
        provider: LLMProvider.OPENAI,
        apiKey: 'test-key',
        model: 'gpt-4o',
      };
      const provider = createProvider(config);
      expect(provider).toBeDefined();
      expect(provider.chat).toBeDefined();
      expect(provider.chatStream).toBeDefined();
      expect(provider.fetchModels).toBeDefined();
    });

    it('应创建 Anthropic provider', () => {
      const config: AnthropicConfig = {
        provider: LLMProvider.ANTHROPIC,
        apiKey: 'test-key',
        model: 'claude-3-5-sonnet',
      };
      const provider = createProvider(config);
      expect(provider).toBeDefined();
      expect(provider.chat).toBeDefined();
      expect(provider.chatStream).toBeDefined();
    });

    it('应创建 Ollama provider', () => {
      const config: OllamaConfig = {
        provider: LLMProvider.OLLAMA,
        baseUrl: 'http://localhost:11434',
        model: 'llama3',
      };
      const provider = createProvider(config);
      expect(provider).toBeDefined();
      expect(provider.chat).toBeDefined();
      expect(provider.chatStream).toBeDefined();
      expect(provider.fetchModels).toBeDefined();
    });

    it('应创建 Gemini provider', () => {
      const config: GeminiConfig = {
        provider: LLMProvider.GEMINI,
        apiKey: 'test-key',
        model: 'gemini-1.5-pro',
      };
      const provider = createProvider(config);
      expect(provider).toBeDefined();
      expect(provider.chat).toBeDefined();
      expect(provider.fetchModels).toBeDefined();
    });

    it('应创建 DeepSeek provider', () => {
      const config: DeepSeekConfig = {
        provider: LLMProvider.DEEPSEEK,
        apiKey: 'test-key',
        model: 'deepseek-chat',
      };
      const provider = createProvider(config);
      expect(provider).toBeDefined();
      expect(provider.chat).toBeDefined();
      expect(provider.chatStream).toBeDefined();
      expect(provider.fetchModels).toBeDefined();
    });

    it('应创建 Moonshot provider', () => {
      const config: MoonshotConfig = {
        provider: LLMProvider.MOONSHOT,
        apiKey: 'test-key',
        model: 'moonshot-v1-8k',
      };
      const provider = createProvider(config);
      expect(provider).toBeDefined();
      expect(provider.chat).toBeDefined();
      expect(provider.chatStream).toBeDefined();
      expect(provider.fetchModels).toBeDefined();
    });

    it('应创建 Qwen provider', () => {
      const config: QwenConfig = {
        provider: LLMProvider.QWEN,
        apiKey: 'test-key',
        model: 'qwen-plus',
      };
      const provider = createProvider(config);
      expect(provider).toBeDefined();
      expect(provider.chat).toBeDefined();
    });

    it('应创建 Custom provider', () => {
      const config: CustomConfig = {
        provider: LLMProvider.CUSTOM,
        apiKey: 'test-key',
        baseUrl: 'https://api.example.com/v1',
        model: 'custom-model',
      };
      const provider = createProvider(config);
      expect(provider).toBeDefined();
      expect(provider.chat).toBeDefined();
      expect(provider.chatStream).toBeDefined();
      expect(provider.fetchModels).toBeDefined();
    });

    it('未知提供商应抛出错误', () => {
      const config = { provider: 'unknown' } as any;
      expect(() => createProvider(config)).toThrow('不支持的 LLM 提供商');
    });
  });

  describe('OpenAIProvider', () => {
    it('chat 方法应正确处理响应', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'OpenAI 响应' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
      });

      const config: OpenAIConfig = { provider: LLMProvider.OPENAI, apiKey: 'test', model: 'gpt-4o' };
      const provider = createProvider(config);
      const response = await provider.chat({ messages: [{ role: MessageRole.USER, content: '你好' }] });

      expect(response.content).toBe('OpenAI 响应');
      expect(response.usage?.promptTokens).toBe(10);
      expect(response.finishReason).toBe('stop');
      expect(global.fetch).toHaveBeenCalledWith('https://api.openai.com/v1/chat/completions', expect.objectContaining({ method: 'POST' }));
    });

    it('chatStream 方法应正确处理流式响应', async () => {
      let readCount = 0;
      const mockStream = {
        getReader: () => ({
          read: async () => {
            readCount++;
            if (readCount === 1) {
              return { done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"流"}}]}\n') };
            }
            if (readCount === 2) {
              return { done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"式"}}]}\n') };
            }
            if (readCount === 3) {
              return { done: false, value: new TextEncoder().encode('data: [DONE]\n') };
            }
            return { done: true, value: undefined };
          },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      });

      const config: OpenAIConfig = { provider: LLMProvider.OPENAI, apiKey: 'test', model: 'gpt-4o' };
      const provider = createProvider(config);
      const chunks: string[] = [];

      await provider.chatStream!({ messages: [{ role: MessageRole.USER, content: '你好' }] }, (chunk) => {
        chunks.push(chunk);
      });

      expect(chunks).toContain('流');
      expect(chunks).toContain('式');
    });

    it('fetchModels 方法应正确获取模型列表', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [
            { id: 'gpt-4o' },
            { id: 'gpt-4o-mini' },
            { id: 'text-embedding-3-small' },
          ],
        }),
      });

      const config: OpenAIConfig = { provider: LLMProvider.OPENAI, apiKey: 'test', model: 'gpt-4o' };
      const provider = createProvider(config);
      const models = await provider.fetchModels!();

      expect(models).toEqual([{ id: 'gpt-4o' }, { id: 'gpt-4o-mini' }]);
      expect(global.fetch).toHaveBeenCalledWith('https://api.openai.com/v1/models', expect.objectContaining({ headers: { Authorization: 'Bearer test' } }));
    });
  });

  describe('AnthropicProvider', () => {
    it('chat 方法应正确处理响应', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          content: [{ type: 'text', text: 'Anthropic 响应' }],
          usage: { input_tokens: 10, output_tokens: 5 },
          stop_reason: 'end_turn',
        }),
      });

      const config: AnthropicConfig = { provider: LLMProvider.ANTHROPIC, apiKey: 'test', model: 'claude-3-5-sonnet' };
      const provider = createProvider(config);
      const response = await provider.chat({ messages: [{ role: MessageRole.USER, content: '你好' }] });

      expect(response.content).toBe('Anthropic 响应');
      expect(response.usage?.totalTokens).toBe(15);
      expect(response.finishReason).toBe('end_turn');
      expect(global.fetch).toHaveBeenCalledWith('https://api.anthropic.com/v1/messages', expect.objectContaining({ method: 'POST' }));
    });

    it('chatStream 方法应正确处理流式响应', async () => {
      let readCount = 0;
      const mockStream = {
        getReader: () => ({
          read: async () => {
            readCount++;
            if (readCount === 1) {
              return { done: false, value: new TextEncoder().encode('data: {"type":"content_block_delta","delta":{"text":"流"}}\n') };
            }
            return { done: true, value: undefined };
          },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      });

      const config: AnthropicConfig = { provider: LLMProvider.ANTHROPIC, apiKey: 'test', model: 'claude-3-5-sonnet' };
      const provider = createProvider(config);
      const chunks: string[] = [];

      await provider.chatStream!({ messages: [{ role: MessageRole.USER, content: '你好' }] }, (chunk) => {
        chunks.push(chunk);
      });

      expect(chunks).toContain('流');
    });
  });

  describe('OllamaProvider', () => {
    it('chat 方法应正确处理响应', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          message: { content: 'Ollama 响应' },
          prompt_eval_count: 10,
          eval_count: 5,
          done: true,
        }),
      });

      const config: OllamaConfig = { provider: LLMProvider.OLLAMA, baseUrl: 'http://localhost:11434', model: 'llama3' };
      const provider = createProvider(config);
      const response = await provider.chat({ messages: [{ role: MessageRole.USER, content: '你好' }] });

      expect(response.content).toBe('Ollama 响应');
      expect(response.usage?.totalTokens).toBe(15);
      expect(response.finishReason).toBe('stop');
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:11434/api/chat', expect.objectContaining({ method: 'POST' }));
    });

    it('chatStream 方法应正确处理流式响应', async () => {
      let readCount = 0;
      const mockStream = {
        getReader: () => ({
          read: async () => {
            readCount++;
            if (readCount === 1) {
              return { done: false, value: new TextEncoder().encode('{"message":{"content":"流"}}') };
            }
            return { done: true, value: undefined };
          },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      });

      const config: OllamaConfig = { provider: LLMProvider.OLLAMA, baseUrl: 'http://localhost:11434', model: 'llama3' };
      const provider = createProvider(config);
      const chunks: string[] = [];

      await provider.chatStream!({ messages: [{ role: MessageRole.USER, content: '你好' }] }, (chunk) => {
        chunks.push(chunk);
      });

      expect(chunks).toContain('流');
    });

    it('fetchModels 方法应正确获取模型列表', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          models: [
            { name: 'llama3', model: 'Meta Llama 3' },
            { name: 'mistral', model: 'Mistral' },
          ],
        }),
      });

      const config: OllamaConfig = { provider: LLMProvider.OLLAMA, baseUrl: 'http://localhost:11434', model: 'llama3' };
      const provider = createProvider(config);
      const models = await provider.fetchModels!();

      expect(models).toEqual([
        { id: 'llama3', name: 'Meta Llama 3' },
        { id: 'mistral', name: 'Mistral' },
      ]);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:11434/api/tags');
    });
  });

  describe('GeminiProvider', () => {
    it('chat 方法应正确处理响应', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: { parts: [{ text: 'Gemini 响应' }] },
            finishReason: 'STOP',
          }],
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
        }),
      });

      const config: GeminiConfig = { provider: LLMProvider.GEMINI, apiKey: 'test', model: 'gemini-1.5-pro' };
      const provider = createProvider(config);
      const response = await provider.chat({ messages: [{ role: MessageRole.USER, content: '你好' }] });

      expect(response.content).toBe('Gemini 响应');
      expect(response.usage?.totalTokens).toBe(15);
      expect(response.finishReason).toBe('STOP');
    });

    it('fetchModels 方法应正确获取模型列表', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          models: [
            { name: 'models/gemini-1.5-pro', displayName: 'Gemini 1.5 Pro' },
            { name: 'models/gemini-1.5-flash', displayName: 'Gemini 1.5 Flash' },
          ],
        }),
      });

      const config: GeminiConfig = { provider: LLMProvider.GEMINI, apiKey: 'test', model: 'gemini-1.5-pro' };
      const provider = createProvider(config);
      const models = await provider.fetchModels!();

      expect(models).toEqual([
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
      ]);
    });
  });

  describe('DeepSeekProvider', () => {
    it('chat 方法应正确处理响应', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'DeepSeek 响应' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
      });

      const config: DeepSeekConfig = { provider: LLMProvider.DEEPSEEK, apiKey: 'test', model: 'deepseek-chat' };
      const provider = createProvider(config);
      const response = await provider.chat({ messages: [{ role: MessageRole.USER, content: '你好' }] });

      expect(response.content).toBe('DeepSeek 响应');
      expect(response.finishReason).toBe('stop');
      expect(global.fetch).toHaveBeenCalledWith('https://api.deepseek.com/v1/chat/completions', expect.objectContaining({ method: 'POST' }));
    });

    it('chatStream 方法应正确处理流式响应', async () => {
      let readCount = 0;
      const mockStream = {
        getReader: () => ({
          read: async () => {
            readCount++;
            if (readCount === 1) {
              return { done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"流"}}]}\n') };
            }
            return { done: true, value: undefined };
          },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      });

      const config: DeepSeekConfig = { provider: LLMProvider.DEEPSEEK, apiKey: 'test', model: 'deepseek-chat' };
      const provider = createProvider(config);
      const chunks: string[] = [];

      await provider.chatStream!({ messages: [{ role: MessageRole.USER, content: '你好' }] }, (chunk) => {
        chunks.push(chunk);
      });

      expect(chunks).toContain('流');
    });

    it('fetchModels 方法应正确获取模型列表', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [{ id: 'deepseek-chat' }, { id: 'deepseek-r1.5' }],
        }),
      });

      const config: DeepSeekConfig = { provider: LLMProvider.DEEPSEEK, apiKey: 'test', model: 'deepseek-chat' };
      const provider = createProvider(config);
      const models = await provider.fetchModels!();

      expect(models).toEqual([{ id: 'deepseek-chat' }, { id: 'deepseek-r1.5' }]);
    });
  });

  describe('MoonshotProvider', () => {
    it('chat 方法应正确处理响应', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Moonshot 响应' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
      });

      const config: MoonshotConfig = { provider: LLMProvider.MOONSHOT, apiKey: 'test', model: 'moonshot-v1-8k' };
      const provider = createProvider(config);
      const response = await provider.chat({ messages: [{ role: MessageRole.USER, content: '你好' }] });

      expect(response.content).toBe('Moonshot 响应');
      expect(response.finishReason).toBe('stop');
      expect(global.fetch).toHaveBeenCalledWith('https://api.moonshot.cn/v1/chat/completions', expect.objectContaining({ method: 'POST' }));
    });

    it('chatStream 方法应正确处理流式响应', async () => {
      let readCount = 0;
      const mockStream = {
        getReader: () => ({
          read: async () => {
            readCount++;
            if (readCount === 1) {
              return { done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"流"}}]}\n') };
            }
            return { done: true, value: undefined };
          },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      });

      const config: MoonshotConfig = { provider: LLMProvider.MOONSHOT, apiKey: 'test', model: 'moonshot-v1-8k' };
      const provider = createProvider(config);
      const chunks: string[] = [];

      await provider.chatStream!({ messages: [{ role: MessageRole.USER, content: '你好' }] }, (chunk) => {
        chunks.push(chunk);
      });

      expect(chunks).toContain('流');
    });

    it('fetchModels 方法应正确获取模型列表', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [{ id: 'moonshot-v1-8k' }, { id: 'moonshot-v1-32k' }],
        }),
      });

      const config: MoonshotConfig = { provider: LLMProvider.MOONSHOT, apiKey: 'test', model: 'moonshot-v1-8k' };
      const provider = createProvider(config);
      const models = await provider.fetchModels!();

      expect(models).toEqual([{ id: 'moonshot-v1-8k' }, { id: 'moonshot-v1-32k' }]);
    });
  });

  describe('QwenProvider', () => {
    it('chat 方法应正确处理响应', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          output: {
            choices: [{ message: { content: 'Qwen 响应' }, finish_reason: 'stop' }],
          },
          usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
        }),
      });

      const config: QwenConfig = { provider: LLMProvider.QWEN, apiKey: 'test', model: 'qwen-plus' };
      const provider = createProvider(config);
      const response = await provider.chat({ messages: [{ role: MessageRole.USER, content: '你好' }] });

      expect(response.content).toBe('Qwen 响应');
      expect(response.finishReason).toBe('stop');
      expect(global.fetch).toHaveBeenCalledWith('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', expect.objectContaining({ method: 'POST' }));
    });
  });

  describe('CustomProvider', () => {
    it('chat 方法应正确处理响应', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Custom 响应' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
      });

      const config: CustomConfig = { provider: LLMProvider.CUSTOM, apiKey: 'test', baseUrl: 'https://api.example.com/v1', model: 'custom-model' };
      const provider = createProvider(config);
      const response = await provider.chat({ messages: [{ role: MessageRole.USER, content: '你好' }] });

      expect(response.content).toBe('Custom 响应');
      expect(response.finishReason).toBe('stop');
      expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/v1/chat/completions', expect.objectContaining({ method: 'POST' }));
    });

    it('chatStream 方法应正确处理流式响应', async () => {
      let readCount = 0;
      const mockStream = {
        getReader: () => ({
          read: async () => {
            readCount++;
            if (readCount === 1) {
              return { done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"流"}}]}\n') };
            }
            return { done: true, value: undefined };
          },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      });

      const config: CustomConfig = { provider: LLMProvider.CUSTOM, apiKey: 'test', baseUrl: 'https://api.example.com/v1', model: 'custom-model' };
      const provider = createProvider(config);
      const chunks: string[] = [];

      await provider.chatStream!({ messages: [{ role: MessageRole.USER, content: '你好' }] }, (chunk) => {
        chunks.push(chunk);
      });

      expect(chunks).toContain('流');
    });

    it('fetchModels 方法应正确获取模型列表', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: [{ id: 'custom-model-1' }, { id: 'custom-model-2' }],
        }),
      });

      const config: CustomConfig = { provider: LLMProvider.CUSTOM, apiKey: 'test', baseUrl: 'https://api.example.com/v1', model: 'custom-model' };
      const provider = createProvider(config);
      const models = await provider.fetchModels!();

      expect(models).toEqual([{ id: 'custom-model-1' }, { id: 'custom-model-2' }]);
    });
  });

  describe('LLMService', () => {
    it('应创建 LLMService 实例', () => {
      const config: OpenAIConfig = { provider: LLMProvider.OPENAI, apiKey: 'test-key', model: 'gpt-4o' };
      const service = new LLMService(config);
      expect(service).toBeDefined();
    });

    it('getConfig 应返回当前配置', () => {
      const config: OpenAIConfig = { provider: LLMProvider.OPENAI, apiKey: 'test-key', model: 'gpt-4o' };
      const service = new LLMService(config);
      expect(service.getConfig()).toEqual(config);
    });

    it('ask 方法应返回响应内容', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '测试响应' } }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
      });

      const config: OpenAIConfig = { provider: LLMProvider.OPENAI, apiKey: 'test-key', model: 'gpt-4o' };
      const service = new LLMService(config);
      const response = await service.ask('你好');

      expect(response).toBe('测试响应');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('chat 方法应正确处理响应', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '响应内容' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
      });

      const config: OpenAIConfig = { provider: LLMProvider.OPENAI, apiKey: 'test-key', model: 'gpt-4o' };
      const service = new LLMService(config);
      const response = await service.chat({ messages: [{ role: MessageRole.USER, content: '你好' }] });

      expect(response.content).toBe('响应内容');
      expect(response.usage).toBeDefined();
      expect(response.finishReason).toBe('stop');
    });

    it('chatStream 方法在不支持流式时应回退到普通请求', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{ content: { parts: [{ text: '回退响应' }] } }],
        }),
      });

      const config: GeminiConfig = { provider: LLMProvider.GEMINI, apiKey: 'test', model: 'gemini-1.5-pro' };
      const service = new LLMService(config);
      const chunks: string[] = [];

      await service.chatStream({ messages: [{ role: MessageRole.USER, content: '你好' }] }, (chunk) => {
        chunks.push(chunk);
      });

      expect(chunks).toEqual(['回退响应']);
    });
  });

  describe('MessageRole', () => {
    it('应包含所有消息角色', () => {
      expect(MessageRole.SYSTEM).toBe('system');
      expect(MessageRole.USER).toBe('user');
      expect(MessageRole.ASSISTANT).toBe('assistant');
    });
  });

  describe('API 错误处理', () => {
    it('OpenAI API 错误应抛出异常', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      });

      const config: OpenAIConfig = { provider: LLMProvider.OPENAI, apiKey: 'invalid', model: 'gpt-4o' };
      const provider = createProvider(config);

      await expect(provider.chat({ messages: [{ role: MessageRole.USER, content: '你好' }] }))
        .rejects
        .toThrow('OpenAI API 错误: 401 - Unauthorized');
    });

    it('Gemini API 错误应抛出异常', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve('Forbidden'),
      });

      const config: GeminiConfig = { provider: LLMProvider.GEMINI, apiKey: 'invalid', model: 'gemini-1.5-pro' };
      const provider = createProvider(config);

      await expect(provider.chat({ messages: [{ role: MessageRole.USER, content: '你好' }] }))
        .rejects
        .toThrow('Gemini API 错误: 403 - Forbidden');
    });

    it('fetchModels 失败应抛出异常', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const config: OpenAIConfig = { provider: LLMProvider.OPENAI, apiKey: 'test', model: 'gpt-4o' };
      const provider = createProvider(config);

      await expect(provider.fetchModels!())
        .rejects
        .toThrow('获取模型列表失败: 500');
    });
  });
});