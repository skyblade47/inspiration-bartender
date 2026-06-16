import {
  parseJsonFromLLMResponse,
  parseArrayFromLLMResponse,
  sanitizeErrorMessage,
} from '../../src/utils/llm-helpers';

describe('llm-helpers', () => {
  describe('parseJsonFromLLMResponse', () => {
    it('应从纯JSON字符串中提取', () => {
      const content = '{"key": "value"}';
      const result = parseJsonFromLLMResponse(content, {});
      expect(result).toEqual({ key: 'value' });
    });

    it('应从code fence中提取JSON', () => {
      const content = '```json\n{"key": "value"}\n```';
      const result = parseJsonFromLLMResponse(content, {});
      expect(result).toEqual({ key: 'value' });
    });

    it('应处理带有前后文本的JSON', () => {
      const content = '以下是结果：\n{"name": "测试"}\n请确认';
      const result = parseJsonFromLLMResponse(content, {});
      expect(result).toEqual({ name: '测试' });
    });

    it('解析失败时应返回默认值', () => {
      const result = parseJsonFromLLMResponse('invalid', { fallback: true });
      expect(result).toEqual({ fallback: true });
    });

    it('无JSON时应返回默认值', () => {
      const result = parseJsonFromLLMResponse('no json here', { default: true });
      expect(result).toEqual({ default: true });
    });
  });

  describe('parseArrayFromLLMResponse', () => {
    it('应从纯数组字符串中提取', () => {
      const content = '["item1", "item2"]';
      const result = parseArrayFromLLMResponse(content, []);
      expect(result).toEqual(['item1', 'item2']);
    });

    it('应从code fence中提取数组', () => {
      const content = '```json\n["item1", "item2"]\n```';
      const result = parseArrayFromLLMResponse(content, []);
      expect(result).toEqual(['item1', 'item2']);
    });

    it('解析失败时应返回默认值', () => {
      const result = parseArrayFromLLMResponse('invalid', ['default']);
      expect(result).toEqual(['default']);
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('应脱敏网络错误', () => {
      const error = new Error('network error');
      const message = sanitizeErrorMessage(error);
      expect(message).toContain('网络');
    });

    it('应脱敏fetch错误', () => {
      const error = new Error('fetch failed');
      const message = sanitizeErrorMessage(error);
      expect(message).toContain('网络');
    });

    it('应脱敏连接错误', () => {
      const error = new Error('connection refused');
      const message = sanitizeErrorMessage(error);
      expect(message).toContain('网络');
    });

    it('应脱敏API错误401', () => {
      const error = new Error('API error 401');
      const message = sanitizeErrorMessage(error);
      expect(message).toContain('API');
    });

    it('应脱敏API错误403', () => {
      const error = new Error('API error 403');
      const message = sanitizeErrorMessage(error);
      expect(message).toContain('API');
    });

    it('应脱敏超时错误', () => {
      const error = new Error('request timeout');
      const message = sanitizeErrorMessage(error);
      expect(message).toContain('超时');
    });

    it('应脱敏频率限制错误', () => {
      const error = new Error('rate limit exceeded');
      const message = sanitizeErrorMessage(error);
      expect(message).toContain('频率');
    });

    it('应脱敏模型不可用错误', () => {
      const error = new Error('model not found');
      const message = sanitizeErrorMessage(error);
      expect(message).toContain('模型');
    });

    it('通用错误应返回默认消息', () => {
      const error = new Error('unknown error');
      const message = sanitizeErrorMessage(error);
      expect(message).toBeDefined();
      expect(message.length).toBeGreaterThan(0);
    });

    it('非Error对象应返回默认消息', () => {
      const message = sanitizeErrorMessage('string error');
      expect(message).toBeDefined();
    });
  });
});
