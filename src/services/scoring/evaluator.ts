/**
 * 评分器实现
 * 实现灵感完整度的评分逻辑
 */

import { Inspiration, InspirationStatus } from '../../types';
import {
  ScoringDimension,
  DimensionScore,
  DimensionConfig,
  DEFAULT_DIMENSION_CONFIGS,
  getDimensionConfig,
  validateWeights,
} from './dimensions';

/**
 * 评分结果接口
 */
export interface ScoringResult {
  /** 总分（0-100） */
  totalScore: number;
  /** 各维度评分 */
  dimensionScores: DimensionScore[];
  /** 对应的状态 */
  status: InspirationStatus;
  /** 评分时间 */
  evaluatedAt: number;
  /** 评分建议 */
  suggestions: string[];
}

/**
 * 评分器配置
 */
export interface EvaluatorConfig {
  /** 维度配置 */
  dimensions: DimensionConfig[];
  /** 状态阈值配置 */
  statusThresholds: StatusThresholds;
}

/**
 * 状态阈值配置
 * 定义各状态对应的分数区间
 */
export interface StatusThresholds {
  /** 种子状态阈值（0-此值） */
  seed: number;
  /** 萌芽状态阈值 */
  sprout: number;
  /** 生长状态阈值 */
  grow: number;
  /** 含苞状态阈值 */
  bud: number;
  /** 绽放状态阈值（此值-100） */
  bloom: number;
}

/**
 * 默认状态阈值
 * 分数区间映射：
 * - 0-20: 种子（seed）
 * - 20-40: 萌芽（sprout）
 * - 40-60: 生长（grow）
 * - 60-80: 含苞（bud）
 * - 80-100: 绽放（bloom）
 */
export const DEFAULT_STATUS_THRESHOLDS: StatusThresholds = {
  seed: 20,
  sprout: 40,
  grow: 60,
  bud: 80,
  bloom: 80,
};

/**
 * 评分器类
 */
export class InspirationEvaluator {
  private config: EvaluatorConfig;

  constructor(config?: Partial<EvaluatorConfig>) {
    const dimensions = config?.dimensions || DEFAULT_DIMENSION_CONFIGS;
    
    // 验证权重配置
    if (!validateWeights(dimensions)) {
      throw new Error('维度权重配置无效：权重之和必须为1');
    }

    this.config = {
      dimensions,
      statusThresholds: config?.statusThresholds || DEFAULT_STATUS_THRESHOLDS,
    };
  }

  /**
   * 评估灵感完整度
   * @param inspiration 灵感对象
   * @returns 评分结果
   */
  evaluate(inspiration: Inspiration): ScoringResult {
    const dimensionScores: DimensionScore[] = [];
    const suggestions: string[] = [];

    // 计算各维度得分
    for (const dimensionConfig of this.config.dimensions) {
      const score = this.evaluateDimension(inspiration, dimensionConfig);
      dimensionScores.push(score);
      
      // 收集改进建议
      if (score.score < 60) {
        suggestions.push(this.generateSuggestion(score));
      }
    }

    // 计算总分（加权平均）
    const totalScore = this.calculateTotalScore(dimensionScores);

    // 映射到状态
    const status = this.mapToStatus(totalScore);

    return {
      totalScore,
      dimensionScores,
      status,
      evaluatedAt: Date.now(),
      suggestions,
    };
  }

  /**
   * 评估单个维度
   * @param inspiration 灵感对象
   * @param config 维度配置
   * @returns 维度评分结果
   */
  private evaluateDimension(
    inspiration: Inspiration,
    config: DimensionConfig
  ): DimensionScore {
    let score = 0;
    let reason = '';

    switch (config.id) {
      case ScoringDimension.CLARITY:
        ({ score, reason } = this.evaluateClarity(inspiration));
        break;
      case ScoringDimension.RICHNESS:
        ({ score, reason } = this.evaluateRichness(inspiration));
        break;
      case ScoringDimension.FEASIBILITY:
        ({ score, reason } = this.evaluateFeasibility(inspiration));
        break;
      case ScoringDimension.UNIQUENESS:
        ({ score, reason } = this.evaluateUniqueness(inspiration));
        break;
      default:
        score = 0;
        reason = '未知维度';
    }

    // 确保分数在有效范围内
    score = Math.max(0, Math.min(config.maxScore, score));

    return {
      dimension: config.id,
      name: config.name,
      score,
      weight: config.weight,
      weightedScore: score * config.weight,
      reason,
    };
  }

  /**
   * 评估清晰度
   * 基于文本长度、结构化内容、名称等判断
   */
  private evaluateClarity(inspiration: Inspiration): { score: number; reason: string } {
    let score = 0;
    const factors: string[] = [];

    // 检查名称（最多25分）
    if (inspiration.name && inspiration.name !== '新灵感') {
      score += 25;
      factors.push('有明确名称');
    }

    // 检查原始输入文本（最多40分）
    const textLength = inspiration.rawInput?.text?.length || 0;
    if (textLength > 0) {
      if (textLength >= 100) {
        score += 40;
        factors.push('文本描述充分');
      } else if (textLength >= 50) {
        score += 30;
        factors.push('有一定文本描述');
      } else {
        score += 15;
        factors.push('文本描述简短');
      }
    }

    // 检查结构化内容（最多35分）
    if (inspiration.structuredContent) {
      const contentKeys = Object.keys(inspiration.structuredContent);
      if (contentKeys.length > 0) {
        score += Math.min(35, contentKeys.length * 10);
        factors.push('有结构化信息');
      }
    }

    const reason = factors.length > 0 ? factors.join('、') : '缺乏清晰表达';
    return { score, reason };
  }

  /**
   * 评估丰富度
   * 基于图片、语音、链接、头脑风暴卡片等判断
   */
  private evaluateRichness(inspiration: Inspiration): { score: number; reason: string } {
    let score = 0;
    const factors: string[] = [];

    // 检查图片（最多20分）
    const imageCount = inspiration.rawInput?.images?.length || 0;
    if (imageCount > 0) {
      score += Math.min(20, imageCount * 10);
      factors.push(`包含${imageCount}张图片`);
    }

    // 检查语音（最多15分）
    if (inspiration.rawInput?.voice) {
      score += 15;
      factors.push('包含语音记录');
    }

    // 检查链接（最多15分）
    if (inspiration.rawInput?.link) {
      score += 15;
      factors.push('包含参考链接');
    }

    // 检查头脑风暴卡片（最多30分）
    const cardCount = inspiration.brainstormCards?.length || 0;
    if (cardCount > 0) {
      score += Math.min(30, cardCount * 10);
      factors.push(`有${cardCount}个头脑风暴卡片`);
    }

    // 检查酿造日志（最多20分）
    const logCount = inspiration.brewingLog?.length || 0;
    if (logCount > 0) {
      score += Math.min(20, logCount * 5);
      factors.push(`有${logCount}条思考记录`);
    }

    const reason = factors.length > 0 ? factors.join('、') : '内容较为单一';
    return { score, reason };
  }

  /**
   * 评估可行性
   * 基于头脑风暴卡片、碰撞历史等判断
   */
  private evaluateFeasibility(inspiration: Inspiration): { score: number; reason: string } {
    let score = 0;
    const factors: string[] = [];

    // 基础分：有内容就有一定可行性
    if (inspiration.rawInput?.text && inspiration.rawInput.text.length > 20) {
      score += 20;
      factors.push('有基本描述');
    }

    // 检查头脑风暴卡片（最多40分）
    const cardCount = inspiration.brainstormCards?.length || 0;
    if (cardCount > 0) {
      score += Math.min(40, cardCount * 15);
      factors.push('经过头脑风暴思考');
    }

    // 检查碰撞历史（最多30分）
    const collisionCount = inspiration.collisionHistory?.length || 0;
    if (collisionCount > 0) {
      score += Math.min(30, collisionCount * 10);
      factors.push('经过灵感碰撞');
    }

    // 检查结构化内容的完整性（最多10分）
    if (inspiration.structuredContent) {
      const content = inspiration.structuredContent;
      // 如果有明确的步骤或计划
      if (content.steps || content.plan || content.actions) {
        score += 10;
        factors.push('有执行计划');
      }
    }

    const reason = factors.length > 0 ? factors.join('、') : '缺乏可行性分析';
    return { score, reason };
  }

  /**
   * 评估独特性
   * 基于碰撞历史、标签、类型等判断
   */
  private evaluateUniqueness(inspiration: Inspiration): { score: number; reason: string } {
    let score = 0;
    const factors: string[] = [];

    // 基础分：每个灵感都有一定独特性
    score += 20;
    factors.push('独特想法');

    // 检查碰撞历史（最多30分）
    const collisionCount = inspiration.collisionHistory?.length || 0;
    if (collisionCount > 0) {
      score += Math.min(30, collisionCount * 15);
      factors.push('经过灵感融合');
    }

    // 检查玻璃杯类型（不同类型代表不同思维模式）
    const uniqueTypes = ['flask', 'beaker', 'martini'];
    if (uniqueTypes.includes(inspiration.type)) {
      score += 15;
      factors.push('独特容器类型');
    }

    // 检查头脑风暴卡片的多样性（最多20分）
    const cardCount = inspiration.brainstormCards?.length || 0;
    if (cardCount >= 3) {
      score += 20;
      factors.push('思维发散充分');
    } else if (cardCount > 0) {
      score += 10;
      factors.push('有一定思维发散');
    }

    // 检查多模态输入（最多15分）
    const inputTypes = [
      inspiration.rawInput?.text,
      inspiration.rawInput?.images?.length,
      inspiration.rawInput?.voice,
      inspiration.rawInput?.link,
    ].filter(Boolean).length;
    
    if (inputTypes >= 3) {
      score += 15;
      factors.push('多维度输入');
    } else if (inputTypes >= 2) {
      score += 8;
    }

    const reason = factors.join('、');
    return { score, reason };
  }

  /**
   * 计算总分（加权平均）
   */
  private calculateTotalScore(dimensionScores: DimensionScore[]): number {
    const totalWeightedScore = dimensionScores.reduce(
      (sum, ds) => sum + ds.weightedScore,
      0
    );
    return Math.round(totalWeightedScore * 100) / 100; // 保留两位小数
  }

  /**
   * 将分数映射到状态
   */
  private mapToStatus(score: number): InspirationStatus {
    const thresholds = this.config.statusThresholds;

    if (score < thresholds.seed) {
      return InspirationStatus.SEED;
    } else if (score < thresholds.sprout) {
      return InspirationStatus.SPROUT;
    } else if (score < thresholds.grow) {
      return InspirationStatus.GROW;
    } else if (score < thresholds.bud) {
      return InspirationStatus.BUD;
    } else {
      return InspirationStatus.BLOOM;
    }
  }

  /**
   * 生成改进建议
   */
  private generateSuggestion(score: DimensionScore): string {
    const suggestions: Record<ScoringDimension, string> = {
      [ScoringDimension.CLARITY]: '建议：添加更清晰的名称和详细描述，帮助明确灵感目标',
      [ScoringDimension.RICHNESS]: '建议：添加图片、语音或参考链接，丰富灵感内容',
      [ScoringDimension.FEASIBILITY]: '建议：进行头脑风暴，思考具体的执行步骤',
      [ScoringDimension.UNIQUENESS]: '建议：尝试与其他灵感碰撞，探索更多可能性',
    };

    return suggestions[score.dimension] || '建议：进一步完善灵感内容';
  }

  /**
   * 快速评分（仅返回总分和状态）
   */
  quickEvaluate(inspiration: Inspiration): { score: number; status: InspirationStatus } {
    const result = this.evaluate(inspiration);
    return {
      score: result.totalScore,
      status: result.status,
    };
  }
}

/**
 * 默认评分器实例
 */
export const defaultEvaluator = new InspirationEvaluator();

/**
 * 便捷评分函数
 */
export function evaluateInspiration(inspiration: Inspiration): ScoringResult {
  return defaultEvaluator.evaluate(inspiration);
}

/**
 * 便捷快速评分函数
 */
export function quickEvaluateInspiration(
  inspiration: Inspiration
): { score: number; status: InspirationStatus } {
  return defaultEvaluator.quickEvaluate(inspiration);
}
