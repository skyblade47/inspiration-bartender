/**
 * LLM 响应解析工具函数
 */

/**
 * 从 LLM 响应中提取并解析 JSON
 * @param content LLM 响应内容
 * @param fallback 解析失败时的默认值
 * @returns 解析后的对象或默认值
 */
export function parseJsonFromLLMResponse<T>(content: string, fallback: T): T {
  try {
    const codeFenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonString = codeFenceMatch ? codeFenceMatch[1] : content;
    
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[LLM Parser] 未找到 JSON 对象');
      return fallback;
    }
    
    return JSON.parse(jsonMatch[0]) as T;
  } catch (error) {
    console.warn('[LLM Parser] JSON 解析失败:', error);
    return fallback;
  }
}

/**
 * 从 LLM 响应中提取数组
 * @param content LLM 响应内容
 * @param fallback 解析失败时的默认值
 * @returns 解析后的数组或默认值
 */
export function parseArrayFromLLMResponse<T>(content: string, fallback: T[]): T[] {
  try {
    const codeFenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonString = codeFenceMatch ? codeFenceMatch[1] : content;
    
    const arrayMatch = jsonString.match(/\[([\s\S]*)\]/);
    if (!arrayMatch) {
      console.warn('[LLM Parser] 未找到数组');
      return fallback;
    }
    
    return JSON.parse(`[${arrayMatch[1]}]`) as T[];
  } catch (error) {
    console.warn('[LLM Parser] 数组解析失败:', error);
    return fallback;
  }
}

/**
 * 错误信息脱敏处理
 * @param error 原始错误
 * @returns 脱敏后的用户友好消息
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return '网络连接异常，请检查网络设置后重试。';
    }
    
    if (message.includes('api') || message.includes('401') || message.includes('403')) {
      return 'API 访问受限，请检查 API Key 配置。';
    }
    
    if (message.includes('timeout')) {
      return '请求超时，请稍后重试。';
    }
    
    if (message.includes('rate') || message.includes('limit')) {
      return '请求频率过高，请稍后再试。';
    }
    
    if (message.includes('model') || message.includes('not found')) {
      return '模型不可用，请选择其他模型。';
    }
    
    return '服务暂时不可用，请稍后重试。';
  }
  
  return '服务调用失败，请稍后重试。';
}