/**
 * LLM 提供商接口模块
 * 统一封装 OpenAI、Anthropic、Ollama 的调用接口
 */

import {
  LLMProvider,
  LLMConfig,
  OpenAIConfig,
  AnthropicConfig,
  OllamaConfig,
} from './config';

// 消息角色类型
export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

// 消息接口
export interface Message {
  role: MessageRole;
  content: string;
}

// 聊天请求参数
export interface ChatRequest {
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

// 聊天响应
export interface ChatResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

// Anthropic 响应内容类型
interface AnthropicContentBlock {
  type: string;
  text: string;
}

interface AnthropicResponse {
  content: AnthropicContentBlock[] | string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  stop_reason?: string;
}

interface AnthropicStreamDelta {
  type: string;
  delta?: {
    text: string;
  };
}

// LLM 提供商接口
export interface ILLMProvider {
  chat(request: ChatRequest): Promise<ChatResponse>;
  chatStream?(request: ChatRequest, onChunk: (chunk: string) => void): Promise<void>;
}
class OpenAIProvider implements ILLMProvider {
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = config;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1';
    
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: request.messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? this.config.maxTokens ?? 2048,
        top_p: request.topP ?? this.config.topP ?? 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API 错误: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      finishReason: data.choices[0].finish_reason,
    };
  }

  // 流式响应（简化实现）
  async chatStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1';
    
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: request.messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? this.config.maxTokens ?? 2048,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API 错误: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('无法获取响应流');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) onChunk(content);
          } catch {
            // 忽略解析错误
          }
        }
      }
    }
  }
}

/**
 * Anthropic 提供商实现
 */
class AnthropicProvider implements ILLMProvider {
  private config: AnthropicConfig;

  constructor(config: AnthropicConfig) {
    this.config = config;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const baseUrl = this.config.baseUrl || 'https://api.anthropic.com';
    
    // 分离 system 消息
    const systemMessage = request.messages.find(m => m.role === MessageRole.SYSTEM);
    const otherMessages = request.messages.filter(m => m.role !== MessageRole.SYSTEM);

    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: request.maxTokens ?? this.config.maxTokens ?? 2048,
        system: systemMessage?.content,
        messages: otherMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        top_p: request.topP ?? this.config.topP,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API 错误: ${response.status} - ${error}`);
    }

    const data = await response.json() as AnthropicResponse;
    
    const content = Array.isArray(data.content)
      ? data.content.map((c) => c.text).join('')
      : data.content;

    return {
      content,
      usage: {
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
        totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      },
      finishReason: data.stop_reason,
    };
  }

  // 流式响应
  async chatStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const baseUrl = this.config.baseUrl || 'https://api.anthropic.com';
    
    const systemMessage = request.messages.find(m => m.role === MessageRole.SYSTEM);
    const otherMessages = request.messages.filter(m => m.role !== MessageRole.SYSTEM);

    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: request.maxTokens ?? this.config.maxTokens ?? 2048,
        system: systemMessage?.content,
        messages: otherMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API 错误: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('无法获取响应流');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta') {
              const content = parsed.delta?.text;
              if (content) onChunk(content);
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }
  }
}

/**
 * Ollama 提供商实现（本地部署）
 */
class OllamaProvider implements ILLMProvider {
  private config: OllamaConfig;

  constructor(config: OllamaConfig) {
    this.config = config;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: request.messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        options: {
          temperature: request.temperature ?? this.config.temperature ?? 0.7,
          num_predict: request.maxTokens ?? this.config.maxTokens ?? 2048,
          top_p: request.topP ?? this.config.topP,
        },
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API 错误: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    return {
      content: data.message?.content || '',
      usage: {
        promptTokens: data.prompt_eval_count ?? 0,
        completionTokens: data.eval_count ?? 0,
        totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
      },
      finishReason: data.done ? 'stop' : undefined,
    };
  }

  // 流式响应
  async chatStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: request.messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API 错误: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('无法获取响应流');

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.message?.content) {
            onChunk(data.message.content);
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  }
}

/**
 * 创建 LLM 提供商实例
 * @param config LLM 配置
 */
export function createProvider(config: LLMConfig): ILLMProvider {
  switch (config.provider) {
    case LLMProvider.OPENAI:
      return new OpenAIProvider(config);
    case LLMProvider.ANTHROPIC:
      return new AnthropicProvider(config);
    case LLMProvider.OLLAMA:
      return new OllamaProvider(config);
    default:
      throw new Error('不支持的 LLM 提供商');
  }
}

/**
 * LLM 服务类
 * 统一管理 LLM 调用
 */
export class LLMService {
  private provider: ILLMProvider;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.provider = createProvider(config);
  }

  /**
   * 发送聊天请求
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.provider.chat(request);
  }

  /**
   * 发送流式聊天请求
   */
  async chatStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    if (!this.provider.chatStream) {
      // 如果不支持流式，回退到普通请求
      const response = await this.chat(request);
      onChunk(response.content);
      return;
    }
    return this.provider.chatStream(request, onChunk);
  }

  /**
   * 简单对话快捷方法
   */
  async ask(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: Message[] = [];
    
    if (systemPrompt) {
      messages.push({ role: MessageRole.SYSTEM, content: systemPrompt });
    }
    
    messages.push({ role: MessageRole.USER, content: prompt });
    
    const response = await this.chat({ messages });
    return response.content;
  }

  /**
   * 获取当前配置
   */
  getConfig(): LLMConfig {
    return this.config;
  }
}
