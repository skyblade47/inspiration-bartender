/**
 * 评分维度定义
 * 定义灵感完整度评分的四个维度及其权重
 */

/**
 * 评分维度枚举
 */
export enum ScoringDimension {
  /** 清晰度 - 灵感表达是否清晰明确 */
  CLARITY = 'clarity',
  /** 丰富度 - 灵感内容的丰富程度 */
  RICHNESS = 'richness',
  /** 可行性 - 灵感的可执行程度 */
  FEASIBILITY = 'feasibility',
  /** 独特性 - 灵感的创新程度 */
  UNIQUENESS = 'uniqueness',
}

/**
 * 维度配置接口
 */
export interface DimensionConfig {
  /** 维度标识 */
  id: ScoringDimension;
  /** 维度名称（中文） */
  name: string;
  /** 维度描述 */
  description: string;
  /** 权重（0-1之间，所有维度权重之和应为1） */
  weight: number;
  /** 最高分 */
  maxScore: number;
}

/**
 * 维度评分结果接口
 */
export interface DimensionScore {
  /** 维度标识 */
  dimension: ScoringDimension;
  /** 维度名称 */
  name: string;
  /** 得分（0-100） */
  score: number;
  /** 权重 */
  weight: number;
  /** 加权得分 */
  weightedScore: number;
  /** 评分说明 */
  reason: string;
}

/**
 * 默认维度配置
 * 四个维度的权重分配：
 * - 清晰度 25%：基础表达能力
 * - 丰富度 30%：内容充实程度
 * - 可行性 25%：落地可能性
 * - 独特性 20%：创新价值
 */
export const DEFAULT_DIMENSION_CONFIGS: DimensionConfig[] = [
  {
    id: ScoringDimension.CLARITY,
    name: '清晰度',
    description: '灵感表达是否清晰明确，目标是否具体',
    weight: 0.25,
    maxScore: 100,
  },
  {
    id: ScoringDimension.RICHNESS,
    name: '丰富度',
    description: '灵感内容的丰富程度，包含的细节和关联信息',
    weight: 0.30,
    maxScore: 100,
  },
  {
    id: ScoringDimension.FEASIBILITY,
    name: '可行性',
    description: '灵感的可执行程度，是否有明确的实施路径',
    weight: 0.25,
    maxScore: 100,
  },
  {
    id: ScoringDimension.UNIQUENESS,
    name: '独特性',
    description: '灵感的创新程度，与现有想法的差异化',
    weight: 0.20,
    maxScore: 100,
  },
];

/**
 * 获取维度配置
 * @param dimension 维度标识
 * @returns 维度配置
 */
export function getDimensionConfig(dimension: ScoringDimension): DimensionConfig {
  const config = DEFAULT_DIMENSION_CONFIGS.find(c => c.id === dimension);
  if (!config) {
    throw new Error(`未知的评分维度: ${dimension}`);
  }
  return config;
}

/**
 * 验证权重配置是否有效
 * @param configs 维度配置数组
 * @returns 是否有效
 */
export function validateWeights(configs: DimensionConfig[]): boolean {
  const totalWeight = configs.reduce((sum, config) => sum + config.weight, 0);
  // 允许 0.01 的误差
  return Math.abs(totalWeight - 1) < 0.01;
}
