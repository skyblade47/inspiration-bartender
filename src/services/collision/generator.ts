/**
 * 碰撞服务 - 配方生成器模块
 * 使用 LLM 生成创意配方建议
 */

import { Inspiration, Recipe, MixedResult, MixType } from '../../types';
import { LLMService } from '../llm/provider';
import { MessageRole, type Message } from '../llm/provider';

// ============================================================
// 类型定义
// ============================================================

/**
 * 配方生成配置
 */
export interface GeneratorConfig {
  /** 生成的配方数量 */
  recipeCount?: number;
  /** 生成温度 */
  temperature?: number;
  /** 最大 token 数 */
  maxTokens?: number;
  /** 系统提示词 */
  systemPrompt?: string;
}

/**
 * 配方生成变量
 */
export interface RecipePromptVars {
  /** 混合结果 */
  mixedResult: MixedResult;
  /** 源灵感列表 */
  inspirations: Inspiration[];
  /** 混合类型 */
  mixType: MixType;
}

// ============================================================
// Prompt 模板
// ============================================================

/**
 * 配方生成系统提示词
 */
export const RECIPE_GENERATION_SYSTEM_PROMPT = `你是一位创意配方大师，擅长将不同的灵感融合成独特的创意方案。
你的任务是根据给定的灵感混合结果，生成 3-5 个富有创意的配方建议。

每个配方应该：
1. 有独特的名称和描述
2. 包含 3-5 个关键词
3. 提供 2-3 个可能的发展方向
4. 给出 0-100 的创意评分

风格要求：
- 富有想象力和创意性
- 保持开放和包容的态度
- 善于发现意想不到的联系
- 用生动有趣的语言描述

请用中文回复，格式化为清晰的 JSON 数组。`;

/**
 * 配方基础 Prompt 模板
 */
const RECIPE_BASE_PROMPT = `灵感碰撞结果：

混合类型：{{mixType}}
混合颜色：{{mixedColor}}
关键词：{{keywords}}
氛围：{{moods}}

源灵感：
{{inspirationsContent}}

请生成创意配方建议。每个配方应该包含：
- title: 方案标题
- description: 详细描述（100-200字）
- keywords: 关键词数组（3-5个）
- directions: 可能的发展方向数组（2-3个）
- score: 创意评分（0-100）

请以 JSON 数组格式返回。`;

/**
 * 创建配方生成 Prompt
 */
function createRecipePrompt(vars: RecipePromptVars): string {
  const mixTypeText = vars.mixType === MixType.LAYER ? '分层混合' : '混色融合';
  
  const inspirationsContent = vars.inspirations
    .map((ins, idx) => `灵感${idx + 1}【${ins.name}】：${ins.rawInput?.text || ''}`)
    .join('\n\n');
  
  return RECIPE_BASE_PROMPT
    .replace('{{mixType}}', mixTypeText)
    .replace('{{mixedColor}}', vars.mixedResult.mixedColor)
    .replace('{{keywords}}', vars.mixedResult.keywords.join('、'))
    .replace('{{moods}}', vars.mixedResult.moods.join('、'))
    .replace('{{inspirationsContent}}', inspirationsContent);
}

// ============================================================
// 配方生成器
// ============================================================

/**
 * 配方生成器类
 * 使用 LLM 生成创意配方建议
 */
export class RecipeGenerator {
  private llmService: LLMService;
  private config: GeneratorConfig;

  constructor(llmService: LLMService, config: GeneratorConfig = {}) {
    this.llmService = llmService;
    this.config = {
      recipeCount: 3,
      temperature: 0.8,
      maxTokens: 2048,
      ...config,
    };
  }

  /**
   * 生成配方
   * @param mixedResult 混合结果
   * @param inspirations 源灵感列表
   * @returns 生成的配方数组
   */
  async generate(
    mixedResult: MixedResult,
    inspirations: Inspiration[]
  ): Promise<Recipe[]> {
    // 构建消息
    const messages = this.buildMessages(mixedResult, inspirations);
    
    // 调用 LLM
    const response = await this.llmService.chat({
      messages,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    });

    // 解析响应
    return this.parseRecipes(response.content);
  }

  /**
   * 流式生成配方
   */
  async *generateStream(
    mixedResult: MixedResult,
    inspirations: Inspiration[]
  ): AsyncGenerator<string, Recipe[], void> {
    const messages = this.buildMessages(mixedResult, inspirations);
    
    let fullContent = '';
    
    await this.llmService.chatStream(
      { messages, temperature: this.config.temperature },
      (chunk) => {
        fullContent += chunk;
      }
    );

    const recipes = this.parseRecipes(fullContent);
    return recipes;
  }

  /**
   * 构建消息列表
   */
  private buildMessages(
    mixedResult: MixedResult,
    inspirations: Inspiration[]
  ): Message[] {
    const userPrompt = createRecipePrompt({
      mixedResult,
      inspirations,
      mixType: mixedResult.mixType,
    });

    return [
      { role: MessageRole.SYSTEM, content: RECIPE_GENERATION_SYSTEM_PROMPT },
      { role: MessageRole.USER, content: userPrompt },
    ];
  }

  /**
   * 解析配方
   */
  private parseRecipes(content: string): Recipe[] {
    try {
      // 尝试提取 JSON 数组
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed
            .filter(item => item.title && item.description)
            .map((item, index) => this.normalizeRecipe(item, index));
        }
      }
      
      // 尝试直接解析
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.map((item, index) => this.normalizeRecipe(item, index));
      }
    } catch (error) {
      console.error('[RecipeGenerator] 解析配方失败:', error);
    }

    // 降级：返回默认配方
    return this.generateFallbackRecipes();
  }

  /**
   * 标准化配方格式
   */
  private normalizeRecipe(item: any, index: number): Recipe {
    return {
      id: `recipe_${Date.now()}_${index}`,
      title: item.title || `创意方案 ${index + 1}`,
      description: item.description || '',
      keywords: Array.isArray(item.keywords) ? item.keywords.slice(0, 5) : [],
      directions: Array.isArray(item.directions) ? item.directions.slice(0, 3) : [],
      score: typeof item.score === 'number' ? Math.max(0, Math.min(100, item.score)) : 70,
    };
  }

  /**
   * 生成降级配方（当 LLM 解析失败时）
   */
  private generateFallbackRecipes(): Recipe[] {
    return [
      {
        id: `recipe_${Date.now()}_fallback_1`,
        title: '融合创意方案',
        description: '基于现有灵感融合产生的创意方案，等待进一步探索。',
        keywords: ['融合', '创新', '探索'],
        directions: ['深入发展第一个灵感', '深入发展第二个灵感', '寻找两者的结合点'],
        score: 60,
      },
    ];
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<GeneratorConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// ============================================================
// 导出
// ============================================================

/**
 * 创建配方生成器
 */
export function createRecipeGenerator(
  llmService: LLMService,
  config?: GeneratorConfig
): RecipeGenerator {
  return new RecipeGenerator(llmService, config);
}
