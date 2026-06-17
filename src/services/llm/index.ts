/**
 * LLM 服务层入口文件
 * 统一导出所有 LLM 相关模块
 */

// 配置管理
export {
  LLMProvider,
  BaseLLMConfig,
  OpenAIConfig,
  AnthropicConfig,
  OllamaConfig,
  LLMConfig,
  initConfigDatabase,
  saveConfig,
  getConfig,
  getDefaultConfig,
  getAllConfigs,
  deleteConfig,
  setDefaultConfig,
  validateConfig,
  getDefaultModels,
} from './config';

// 提供商接口
export {
  MessageRole,
  Message,
  ChatRequest,
  ChatResponse,
  ILLMProvider,
  createProvider,
  LLMService,
} from './provider';

// 调酒对话 Prompt
export {
  BrewingPromptVars,
  PromptTemplate,
  BREWING_SYSTEM_PROMPT,
  INITIAL_BREWING_PROMPT,
  CONTINUE_BREWING_PROMPT,
  DEEPEN_BREWING_PROMPT,
  COMPLETE_BREWING_PROMPT,
  PREFERENCE_AWARE_PROMPT,
  createInitialPrompt,
  createContinuePrompt,
  createDeepenPrompt,
  createCompletePrompt,
  buildBrewingMessages,
} from './prompts/brewing';

// 评分 Prompt
export {
  ScoringPromptVars,
  LLMParsedScoringResult,
  LocalDimensionScores,
  SCORING_SYSTEM_PROMPT,
  BASE_SCORING_PROMPT,
  QUICK_SCORING_PROMPT,
  DETAILED_SCORING_PROMPT,
  COMPARATIVE_SCORING_PROMPT,
  PROGRESS_SCORING_PROMPT,
  createBaseScoringPrompt,
  createDetailedScoringPrompt,
  createQuickScoringPrompt,
  createProgressScoringPrompt,
  parseScoringResult,
  buildScoringMessages,
  calculateWeightedScore,
  convertLLMToLocalDimensions,
} from './prompts/scoring';

// 导入类型和类用于便捷使用
import { LLMConfig, getDefaultConfig, validateConfig } from './config';
import { LLMService, MessageRole, Message, ChatRequest } from './provider';
import {
  createInitialPrompt,
  createContinuePrompt,
  createDeepenPrompt,
  buildBrewingMessages,
} from './prompts/brewing';
import {
  createBaseScoringPrompt,
  createDetailedScoringPrompt,
  createQuickScoringPrompt,
  parseScoringResult,
  buildScoringMessages,
} from './prompts/scoring';

// 辅助函数：将消息转换为 Message 类型
function toMessages(msgs: Array<{role: 'system' | 'user' | 'assistant'; content: string}>): Message[] {
  const roleMap: Record<string, MessageRole> = {
    'system': MessageRole.SYSTEM,
    'user': MessageRole.USER,
    'assistant': MessageRole.ASSISTANT,
  };
  return msgs.map(m => ({
    role: roleMap[m.role],
    content: m.content,
  }));
}

/**
 * 初始化 LLM 服务
 * 使用默认配置创建服务实例
 */
export async function initLLMService(): Promise<LLMService | null> {
  const config = await getDefaultConfig();
  if (!config) {
    console.warn('未找到默认 LLM 配置，请先配置 LLM 提供商');
    return null;
  }
  
  if (!validateConfig(config)) {
    console.warn('LLM 配置无效，请检查配置');
    return null;
  }
  
  return new LLMService(config);
}

/**
 * 调酒对话服务
 * 封装调酒相关的 LLM 调用
 */
export class BrewingService {
  private llmService: LLMService;

  constructor(llmService: LLMService) {
    this.llmService = llmService;
  }

  /**
   * 开始新的调酒对话
   */
  async startBrewing(userInput: string): Promise<string> {
    const prompt = createInitialPrompt(userInput);
    const messages = buildBrewingMessages(prompt);
    const response = await this.llmService.chat({ messages: toMessages(messages) });
    return response.content;
  }

  /**
   * 继续调酒对话
   */
  async continueBrewing(
    userInput: string,
    inspirationName: string,
    currentStatus: string,
    conversationHistory: string
  ): Promise<string> {
    const prompt = createContinuePrompt({
      userInput,
      inspirationName,
      currentStatus,
      conversationHistory,
    });
    const messages = buildBrewingMessages(prompt);
    const response = await this.llmService.chat({ messages: toMessages(messages) });
    return response.content;
  }

  /**
   * 深化灵感
   */
  async deepenInspiration(
    userInput: string,
    inspirationName: string,
    currentStatus: string,
    brewingLog: string
  ): Promise<string> {
    const prompt = createDeepenPrompt({
      userInput,
      inspirationName,
      currentStatus,
      brewingLog,
    });
    const messages = buildBrewingMessages(prompt);
    const response = await this.llmService.chat({ messages: toMessages(messages) });
    return response.content;
  }

  /**
   * 流式对话
   */
  async streamBrewing(
    userInput: string,
    inspirationName: string,
    currentStatus: string,
    conversationHistory: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const prompt = createContinuePrompt({
      userInput,
      inspirationName,
      currentStatus,
      conversationHistory,
    });
    const messages = buildBrewingMessages(prompt);
    await this.llmService.chatStream({ messages: toMessages(messages) }, onChunk);
  }
}

/**
 * 评分服务
 * 封装评分相关的 LLM 调用
 */
export class ScoringService {
  private llmService: LLMService;

  constructor(llmService: LLMService) {
    this.llmService = llmService;
  }

  /**
   * 基础评分
   */
  async scoreInspiration(
    inspirationName: string,
    inspirationDescription?: string,
    brewingLog?: string
  ): Promise<import('./prompts/scoring').LLMParsedScoringResult> {
    const prompt = createBaseScoringPrompt({
      inspirationName,
      inspirationDescription,
      brewingLog,
    });
    const messages = buildScoringMessages(prompt);
    const response = await this.llmService.chat({ messages: toMessages(messages) });
    return parseScoringResult(response.content);
  }

  /**
   * 详细评分
   */
  async detailedScore(
    inspirationName: string,
    inspirationDescription: string,
    brewingLog: string,
    dimensions?: string,
    criteria?: string
  ): Promise<import('./prompts/scoring').LLMParsedScoringResult> {
    const prompt = createDetailedScoringPrompt({
      inspirationName,
      inspirationDescription,
      brewingLog,
      dimensions,
      criteria,
    });
    const messages = buildScoringMessages(prompt);
    const response = await this.llmService.chat({ messages: toMessages(messages) });
    return parseScoringResult(response.content);
  }

  /**
   * 快速评分
   */
  async quickScore(
    inspirationName: string,
    inspirationDescription?: string
  ): Promise<import('./prompts/scoring').LLMParsedScoringResult> {
    const prompt = createQuickScoringPrompt({
      inspirationName,
      inspirationDescription,
    });
    const messages = buildScoringMessages(prompt);
    const response = await this.llmService.chat({ messages: toMessages(messages) });
    return parseScoringResult(response.content);
  }
}

/**
 * 创建调酒服务实例
 */
export function createBrewingService(llmService: LLMService): BrewingService {
  return new BrewingService(llmService);
}

/**
 * 创建评分服务实例
 */
export function createScoringService(llmService: LLMService): ScoringService {
  return new ScoringService(llmService);
}
