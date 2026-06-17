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
import { scoringCache } from './cache';

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
    // 检查缓存
    const cached = scoringCache.get(inspiration);
    if (cached) {
      return cached;
    }

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

    const result: ScoringResult = {
      totalScore,
      dimensionScores,
      status,
      evaluatedAt: Date.now(),
      suggestions,
    };

    // 设置缓存
    scoringCache.set(inspiration, result);

    return result;
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
   * 名称质量(30分) + 文本质量(40分) + 结构化程度(30分)
   */
  private evaluateClarity(inspiration: Inspiration): { score: number; reason: string } {
    let score = 0;
    const factors: string[] = [];

    // 名称质量（最多30分）
    const nameScore = this.evaluateNameQuality(inspiration);
    score += nameScore.score;
    if (nameScore.factor) factors.push(nameScore.factor);

    // 文本质量（最多40分）
    const textScore = this.evaluateTextQuality(inspiration);
    score += textScore.score;
    if (textScore.factor) factors.push(textScore.factor);

    // 结构化程度（最多30分）
    const structScore = this.evaluateStructuredContent(inspiration);
    score += structScore.score;
    if (structScore.factor) factors.push(structScore.factor);

    const reason = factors.length > 0 ? factors.join('、') : '缺乏清晰表达';
    return { score, reason };
  }

  /**
   * 评估名称质量（满分30分）
   */
  private evaluateNameQuality(inspiration: Inspiration): { score: number; factor?: string } {
    if (!inspiration.name || inspiration.name === '新灵感') {
      return { score: 0 };
    }

    let score = 20; // 有明确名称
    let factor = '有明确名称';

    // 名称长度≥5字符
    if (inspiration.name.length >= 5) {
      score += 5;
    }

    // 名称包含关键词
    const keywords = ['项目', '计划', '方案', '创意', '想法', '设计', '产品', '应用'];
    if (keywords.some(kw => inspiration.name.includes(kw))) {
      score += 5;
      factor = '名称清晰明确';
    }

    return { score, factor };
  }

  /**
   * 评估文本质量（满分40分）
   */
  private evaluateTextQuality(inspiration: Inspiration): { score: number; factor?: string } {
    const text = inspiration.rawInput?.text || '';
    const textLength = text.length;

    if (textLength === 0) {
      return { score: 0 };
    }

    let score = 0;
    const factors: string[] = [];

    // 基础分：文本长度≥50字符
    if (textLength >= 50) {
      score += 15;
      factors.push('有一定描述');
    }

    // 结构分：有分段（换行符）或列表
    if (text.includes('\n') || text.includes('-') || text.includes('•') || text.includes('1.') || text.includes('*')) {
      score += 10;
      factors.push('结构清晰');
    }

    // 关键词分：包含行动词
    const actionWords = ['实现', '开发', '设计', '制作', '完成', '构建', '创建', '实现', '执行'];
    if (actionWords.some(word => text.includes(word))) {
      score += 10;
      factors.push('有行动导向');
    }

    // 完整分：长度≥100字符
    if (textLength >= 100) {
      score += 5;
    }

    return { score, factor: factors.length > 0 ? factors.join('、') : '文本简短' };
  }

  /**
   * 评估结构化程度（满分30分）
   */
  private evaluateStructuredContent(inspiration: Inspiration): { score: number; factor?: string } {
    if (!inspiration.structuredContent) {
      return { score: 0 };
    }

    const content = inspiration.structuredContent;
    const validFields: string[] = [];

    // 检查有效字段
    const fieldChecks = [
      { key: 'title', value: content.title },
      { key: 'summary', value: content.summary },
      { key: 'categories', value: content.categories?.length ? content.categories : null },
      { key: 'tags', value: content.tags?.length ? content.tags : null },
      { key: 'steps', value: content.steps?.length ? content.steps : null },
      { key: 'plan', value: content.plan },
      { key: 'actions', value: content.actions?.length ? content.actions : null },
    ];

    for (const field of fieldChecks) {
      if (field.value) {
        validFields.push(field.key);
      }
    }

    if (validFields.length === 0) {
      return { score: 0 };
    }

    const score = Math.min(30, validFields.length * 10);
    return { score, factor: `有${validFields.length}个结构化字段` };
  }

  /**
   * 评估丰富度
   * 多模态输入(25分) + 头脑风暴深度(35分) + 酿造日志质量(25分) + 时间投入(15分)
   */
  private evaluateRichness(inspiration: Inspiration): { score: number; reason: string } {
    let score = 0;
    const factors: string[] = [];

    // 多模态输入（最多25分）
    const modalScore = this.evaluateMultiModal(inspiration);
    score += modalScore.score;
    if (modalScore.factor) factors.push(modalScore.factor);

    // 头脑风暴深度（最多35分）
    const brainstormScore = this.evaluateBrainstormDepth(inspiration);
    score += brainstormScore.score;
    if (brainstormScore.factor) factors.push(brainstormScore.factor);

    // 酿造日志质量（最多25分）
    const logScore = this.evaluateBrewingLogQuality(inspiration);
    score += logScore.score;
    if (logScore.factor) factors.push(logScore.factor);

    // 时间投入（最多15分）
    const timeScore = this.evaluateTimeInvestment(inspiration);
    score += timeScore.score;
    if (timeScore.factor) factors.push(timeScore.factor);

    const reason = factors.length > 0 ? factors.join('、') : '内容较为单一';
    return { score, reason };
  }

  /**
   * 评估多模态输入（满分25分）
   */
  private evaluateMultiModal(inspiration: Inspiration): { score: number; factor?: string } {
    const hasText = !!(inspiration.rawInput?.text);
    const hasImages = !!(inspiration.rawInput?.images?.length);
    const hasVoice = !!(inspiration.rawInput?.voice);
    const hasLink = !!(inspiration.rawInput?.link);

    const inputTypes = [hasText, hasImages, hasVoice, hasLink].filter(Boolean).length;

    if (inputTypes >= 3) {
      return { score: 25, factor: '多模态输入丰富' };
    } else if (inputTypes === 2 && hasImages) {
      return { score: 15, factor: '图文结合' };
    } else if (hasText) {
      return { score: 5, factor: '纯文本输入' };
    }

    return { score: 0 };
  }

  /**
   * 评估头脑风暴深度（满分35分）
   */
  private evaluateBrainstormDepth(inspiration: Inspiration): { score: number; factor?: string } {
    const cards = inspiration.brainstormCards || [];
    if (cards.length === 0) {
      return { score: 0 };
    }

    let score = 0;
    const factors: string[] = [];

    // 卡片数量：每张10分（最高20分）
    const cardCountScore = Math.min(20, cards.length * 10);
    score += cardCountScore;

    // 卡片内容质量：有详细描述（≥20字符）的卡片每张+5分（最高15分）
    const detailedCards = cards.filter(card => (card.content?.length || 0) >= 20);
    const qualityScore = Math.min(15, detailedCards.length * 5);
    score += qualityScore;

    if (cards.length > 0) {
      factors.push(`有${cards.length}张头脑风暴卡片`);
    }
    if (detailedCards.length > 0) {
      factors.push(`${detailedCards.length}张卡片有详细描述`);
    }

    return { score, factor: factors.length > 0 ? factors.join('，') : undefined };
  }

  /**
   * 评估酿造日志质量（满分25分）
   */
  private evaluateBrewingLogQuality(inspiration: Inspiration): { score: number; factor?: string } {
    const logs = inspiration.brewingLog || [];
    if (logs.length === 0) {
      return { score: 0 };
    }

    let score = 0;
    const factors: string[] = [];

    // 日志条数：每条5分（最高15分）
    const logCountScore = Math.min(15, logs.length * 5);
    score += logCountScore;

    // 日志长度：平均≥50字符
    const avgLength = logs.reduce((sum, log) => sum + (log.content?.length || 0), 0) / logs.length;
    if (avgLength >= 50) {
      score += 10;
      factors.push('日志内容充实');
    }

    if (logs.length > 0) {
      factors.unshift(`有${logs.length}条酿造日志`);
    }

    return { score, factor: factors.length > 0 ? factors.join('，') : undefined };
  }

  /**
   * 评估时间投入（满分15分）
   */
  private evaluateTimeInvestment(inspiration: Inspiration): { score: number; factor?: string } {
    let score = 0;
    const factors: string[] = [];

    const now = Date.now();
    const createdAt = inspiration.createdAt;
    const updatedAt = inspiration.updatedAt;

    // 创建时间距今≥1天
    const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation >= 1) {
      score += 5;
    }

    // 有更新记录（updatedAt !== createdAt）
    const hasUpdate = updatedAt !== createdAt;
    if (hasUpdate) {
      score += 5;
      factors.push('有持续更新');
    }

    // 最近7天内有更新
    const daysSinceUpdate = (now - updatedAt) / (1000 * 60 * 60 * 24);
    if (hasUpdate && daysSinceUpdate <= 7) {
      score += 5;
      factors.push('近期活跃');
    }

    return { score, factor: factors.length > 0 ? factors.join('、') : undefined };
  }

  /**
   * 评估可行性
   * 基础可行性(20分) + 思考深度(40分) + 碰撞验证(30分) + 执行规划(10分)
   */
  private evaluateFeasibility(inspiration: Inspiration): { score: number; reason: string } {
    let score = 0;
    const factors: string[] = [];

    // 基础可行性（最多20分）
    const baseScore = this.evaluateBaseFeasibility(inspiration);
    score += baseScore.score;
    if (baseScore.factor) factors.push(baseScore.factor);

    // 思考深度（最多40分）
    const thinkScore = this.evaluateThinkingDepth(inspiration);
    score += thinkScore.score;
    if (thinkScore.factor) factors.push(thinkScore.factor);

    // 碰撞验证（最多30分）
    const collisionScore = this.evaluateCollisionValidation(inspiration);
    score += collisionScore.score;
    if (collisionScore.factor) factors.push(collisionScore.factor);

    // 执行规划（最多10分）
    const planScore = this.evaluateExecutionPlan(inspiration);
    score += planScore.score;
    if (planScore.factor) factors.push(planScore.factor);

    const reason = factors.length > 0 ? factors.join('、') : '缺乏可行性分析';
    return { score, reason };
  }

  /**
   * 评估基础可行性（满分20分）
   */
  private evaluateBaseFeasibility(inspiration: Inspiration): { score: number; factor?: string } {
    const textLength = inspiration.rawInput?.text?.length || 0;
    if (textLength >= 30) {
      return { score: 20, factor: '有基本描述' };
    }
    return { score: 0 };
  }

  /**
   * 评估思考深度（满分40分）
   */
  private evaluateThinkingDepth(inspiration: Inspiration): { score: number; factor?: string } {
    const cards = inspiration.brainstormCards || [];
    if (cards.length === 0) {
      return { score: 0 };
    }

    let score = 0;
    const factors: string[] = [];

    // 头脑风暴卡片：每张15分（最高30分）
    const cardScore = Math.min(30, cards.length * 15);
    score += cardScore;

    // 卡片有可行性行动词
    const actionWords = ['实现', '完成', '执行', '计划', '开发', '构建', '部署', '上线'];
    const hasActionWord = cards.some(card => 
      actionWords.some(word => card.content?.includes(word) || card.title?.includes(word))
    );
    if (hasActionWord) {
      score += 10;
      factors.push('有行动导向');
    }

    if (cards.length > 0) {
      factors.unshift(`经过${cards.length}轮头脑风暴`);
    }

    return { score, factor: factors.length > 0 ? factors.join('，') : undefined };
  }

  /**
   * 评估碰撞验证（满分30分）
   */
  private evaluateCollisionValidation(inspiration: Inspiration): { score: number; factor?: string } {
    const collisions = inspiration.collisionHistory || [];
    if (collisions.length === 0) {
      return { score: 0 };
    }

    let score = 0;
    const factors: string[] = [];

    // 碰撞次数：每次10分（最高30分）
    const collisionScore = Math.min(30, collisions.length * 10);
    score += collisionScore;

    // 碰撞产生配方（额外加分，但总上限30分）
    const hasRecipes = collisions.some(c => c.recipes && c.recipes.length > 0);
    if (hasRecipes && score < 30) {
      score = Math.min(30, score + 10);
      factors.push('产生创新配方');
    }

    factors.unshift(`经过${collisions.length}次灵感碰撞`);

    return { score: Math.min(30, score), factor: factors.join('，') };
  }

  /**
   * 评估执行规划（满分10分）
   */
  private evaluateExecutionPlan(inspiration: Inspiration): { score: number; factor?: string } {
    const content = inspiration.structuredContent;
    if (!content) {
      return { score: 0 };
    }

    // 有明确的steps/plan/actions字段
    if (content.steps?.length || content.plan || content.actions?.length) {
      return { score: 10, factor: '有执行计划' };
    }

    return { score: 0 };
  }

  /**
   * 评估独特性
   * 基础独特性(20分) + 创新组合(35分) + 思维发散(25分) + 多维度输入(20分)
   */
  private evaluateUniqueness(inspiration: Inspiration): { score: number; reason: string } {
    let score = 0;
    const factors: string[] = [];

    // 基础独特性（20分）
    score += 20;
    factors.push('独特想法');

    // 创新组合（最多35分）
    const innovationScore = this.evaluateInnovationCombination(inspiration);
    score += innovationScore.score;
    if (innovationScore.factor) factors.push(innovationScore.factor);

    // 思维发散（最多25分）
    const divergenceScore = this.evaluateMindDivergence(inspiration);
    score += divergenceScore.score;
    if (divergenceScore.factor) factors.push(divergenceScore.factor);

    // 多维度输入（最多20分）
    const multiDimScore = this.evaluateMultiDimensionInput(inspiration);
    score += multiDimScore.score;
    if (multiDimScore.factor) factors.push(multiDimScore.factor);

    const reason = factors.join('、');
    return { score, reason };
  }

  /**
   * 评估创新组合（满分35分）
   */
  private evaluateInnovationCombination(inspiration: Inspiration): { score: number; factor?: string } {
    const collisions = inspiration.collisionHistory || [];
    if (collisions.length === 0) {
      return { score: 0 };
    }

    let score = 0;
    const factors: string[] = [];

    // 碰撞次数：每次15分（最高25分）
    const collisionScore = Math.min(25, collisions.length * 15);
    score += collisionScore;

    // 碰撞产生配方（recipes.length > 0）
    const hasRecipes = collisions.some(c => c.recipes && c.recipes.length > 0);
    if (hasRecipes) {
      score += 10;
      factors.push('产生创新配方');
    }

    if (collisions.length > 0) {
      factors.unshift(`经过${collisions.length}次灵感融合`);
    }

    return { score, factor: factors.length > 0 ? factors.join('，') : undefined };
  }

  /**
   * 评估思维发散（满分25分）
   */
  private evaluateMindDivergence(inspiration: Inspiration): { score: number; factor?: string } {
    const cards = inspiration.brainstormCards || [];
    
    if (cards.length >= 3) {
      return { score: 25, factor: '思维发散充分' };
    } else if (cards.length >= 1) {
      return { score: 15, factor: '有一定思维发散' };
    }

    return { score: 0 };
  }

  /**
   * 评估多维度输入（满分20分）
   */
  private evaluateMultiDimensionInput(inspiration: Inspiration): { score: number; factor?: string } {
    const hasText = !!(inspiration.rawInput?.text);
    const hasImages = !!(inspiration.rawInput?.images?.length);
    const hasVoice = !!(inspiration.rawInput?.voice);
    const hasLink = !!(inspiration.rawInput?.link);

    const inputTypes = [hasText, hasImages, hasVoice, hasLink].filter(Boolean).length;

    if (inputTypes >= 3) {
      return { score: 20, factor: '多维度输入' };
    } else if (inputTypes === 2) {
      return { score: 10, factor: '双维度输入' };
    }

    return { score: 0 };
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
