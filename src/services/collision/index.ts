/**
 * 碰撞服务入口文件
 * 统一导出碰撞相关的所有模块
 */

// 工具函数
export {
  // ID 生成
  generateCollisionId,
  generateInspirationId,
  // 颜色处理
  hexToRgb,
  rgbToHex,
  mixColors,
  gradientMixColors,
  getGlassDefaultColor,
  getStatusDefaultColor,
  ColorMixMode,
  type RGB,
  // 类型判断
  isValidInspiration,
  isValidCollisionSource,
  // 内容提取
  extractKeywords,
  extractCommonThemes,
  mergeInspirationContent,
  // 混合策略
  decideMixType,
  calculateMixIntensity,
} from './utils';

// 灵感混合器
export {
  InspirationMixer,
  getMixer,
  createMixer,
  type MixerConfig,
  type MixOptions,
} from './mixer';

// 配方生成器
export {
  RecipeGenerator,
  createRecipeGenerator,
  RECIPE_GENERATION_SYSTEM_PROMPT,
  type GeneratorConfig,
  type RecipePromptVars,
} from './generator';

// 碰撞历史管理
export {
  CollisionHistoryManager,
  getHistoryManager,
  createHistoryManager,
  MemoryCollisionStorage,
  type ICollisionStorage,
  type CollisionQueryOptions,
} from './history';

// 重新导出类型
export type { CollisionRecord, Recipe, MixedResult, MixType } from '../../types';
