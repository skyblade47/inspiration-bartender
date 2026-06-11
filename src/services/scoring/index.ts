/**
 * 评分系统入口文件
 * 导出评分相关的所有类型、配置和函数
 */

// 导出维度相关
export {
  ScoringDimension,
  DimensionConfig,
  DimensionScore,
  DEFAULT_DIMENSION_CONFIGS,
  getDimensionConfig,
  validateWeights,
} from './dimensions';

// 导出评分器相关
export {
  ScoringResult,
  EvaluatorConfig,
  StatusThresholds,
  DEFAULT_STATUS_THRESHOLDS,
  InspirationEvaluator,
  defaultEvaluator,
  evaluateInspiration,
  quickEvaluateInspiration,
} from './evaluator';
