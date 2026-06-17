/**
 * 混合评分服务
 * 统一本地评分和LLM评分入口
 */

import { Inspiration } from '../../types';
import { ScoringResult, InspirationEvaluator, defaultEvaluator } from './evaluator';
import { scoringCache } from './cache';
import { ScoringDimension, DimensionScore } from './dimensions';
import { initLLMService, createScoringService, convertLLMToLocalDimensions, LocalDimensionScores } from '../llm';

// 深度评分结果
export interface DeepScoringResult extends ScoringResult {
  llmComment: string;
  llmSuggestions: string[];
  source: 'local' | 'llm' | 'hybrid';
}

// LLM评分配置
export interface LLMScoringConfig {
  maxDailyCalls: number;      // 默认10次
  maxTokens: number;          // 默认500
  enableAutoScoring: boolean; // 默认false
}

const DEFAULT_LLM_CONFIG: LLMScoringConfig = {
  maxDailyCalls: 10,
  maxTokens: 500,
  enableAutoScoring: false,
};

// 每日调用计数
let dailyCallCount = 0;
let lastResetDate = new Date().toDateString();

/**
 * 混合评分服务类
 */
export class HybridScoringService {
  private evaluator: InspirationEvaluator;
  private llmConfig: LLMScoringConfig;

  constructor(evaluator?: InspirationEvaluator, llmConfig?: Partial<LLMScoringConfig>) {
    this.evaluator = evaluator || defaultEvaluator;
    this.llmConfig = { ...DEFAULT_LLM_CONFIG, ...llmConfig };
  }

  /**
   * 快速评分（本地，带缓存）
   */
  quickScore(inspiration: Inspiration): ScoringResult {
    // 检查缓存
    const cached = scoringCache.get(inspiration);
    if (cached) {
      return cached;
    }

    // 本地评分
    const result = this.evaluator.evaluate(inspiration);
    
    // 设置缓存
    scoringCache.set(inspiration, result);
    
    return result;
  }

  /**
   * 深度评分（LLM，带缓存）
   */
  async deepScore(inspiration: Inspiration): Promise<DeepScoringResult> {
    // 检查每日调用限制
    this.resetDailyCountIfNeeded();
    
    if (dailyCallCount >= this.llmConfig.maxDailyCalls) {
      // 超过限制，回退到本地评分
      const localResult = this.quickScore(inspiration);
      return {
        ...localResult,
        llmComment: '今日LLM评分次数已达上限，使用本地评分',
        llmSuggestions: [],
        source: 'local',
      };
    }

    try {
      // 初始化LLM服务
      const llmService = await initLLMService();
      
      if (!llmService) {
        // 未配置LLM，回退到本地评分
        const localResult = this.quickScore(inspiration);
        return {
          ...localResult,
          llmComment: 'LLM服务未配置，使用本地评分',
          llmSuggestions: [],
          source: 'local',
        };
      }

      const scoringService = createScoringService(llmService);
      
      // 调用LLM评分
      const llmResult = await scoringService.quickScore(
        inspiration.name,
        inspiration.rawInput?.text
      );

      dailyCallCount++;

      // 转换维度
      const localDimensions = convertLLMToLocalDimensions(llmResult);

      // 构建结果
      const result: DeepScoringResult = {
        totalScore: Math.round(
          localDimensions.clarity * 0.25 +
          localDimensions.richness * 0.30 +
          localDimensions.feasibility * 0.25 +
          localDimensions.uniqueness * 0.20
        ),
        dimensionScores: [
          { dimension: ScoringDimension.CLARITY, name: '清晰度', score: localDimensions.clarity, weight: 0.25, weightedScore: localDimensions.clarity * 0.25, reason: 'LLM评估' },
          { dimension: ScoringDimension.RICHNESS, name: '丰富度', score: localDimensions.richness, weight: 0.30, weightedScore: localDimensions.richness * 0.30, reason: 'LLM评估' },
          { dimension: ScoringDimension.FEASIBILITY, name: '可行性', score: localDimensions.feasibility, weight: 0.25, weightedScore: localDimensions.feasibility * 0.25, reason: 'LLM评估' },
          { dimension: ScoringDimension.UNIQUENESS, name: '独特性', score: localDimensions.uniqueness, weight: 0.20, weightedScore: localDimensions.uniqueness * 0.20, reason: 'LLM评估' },
        ],
        status: this.evaluator.quickEvaluate(inspiration).status,
        evaluatedAt: Date.now(),
        suggestions: llmResult.suggestions,
        llmComment: llmResult.comment,
        llmSuggestions: llmResult.suggestions,
        source: 'llm',
      };

      return result;
    } catch (error) {
      // LLM调用失败，回退到本地评分
      const localResult = this.quickScore(inspiration);
      return {
        ...localResult,
        llmComment: 'LLM评分失败，使用本地评分',
        llmSuggestions: [],
        source: 'local',
      };
    }
  }

  /**
   * 强制刷新（清除缓存重新计算）
   */
  refreshScore(inspiration: Inspiration): ScoringResult {
    scoringCache.clear(inspiration.id);
    return this.evaluator.evaluate(inspiration);
  }

  /**
   * 重置每日计数（如果需要）
   */
  private resetDailyCountIfNeeded(): void {
    const today = new Date().toDateString();
    if (today !== lastResetDate) {
      dailyCallCount = 0;
      lastResetDate = today;
    }
  }
}

// 默认实例
export const hybridScoringService = new HybridScoringService();

// 便捷函数
export function quickScoreInspiration(inspiration: Inspiration): ScoringResult {
  return hybridScoringService.quickScore(inspiration);
}

export async function deepScoreInspiration(inspiration: Inspiration): Promise<DeepScoringResult> {
  return hybridScoringService.deepScore(inspiration);
}