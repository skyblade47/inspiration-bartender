/**
 * 碰撞服务 - 灵感混合器模块
 * 负责将多个灵感进行混合，生成混合结果
 */

import { Inspiration, InspirationStatus, GlassType, MixType, MixedResult } from '../../types';
import {
  mixColors,
  getGlassDefaultColor,
  extractKeywords,
  extractCommonThemes,
  mergeInspirationContent,
  decideMixType,
  calculateMixIntensity,
  ColorMixMode,
  type RGB,
} from './utils';

// ============================================================
// 类型定义
// ============================================================

/**
 * 混合器配置
 */
export interface MixerConfig {
  /** 默认混合模式 */
  defaultMixMode?: ColorMixMode;
  /** 是否自动提取主题 */
  autoExtractThemes?: boolean;
  /** 混合强度阈值 */
  intensityThreshold?: number;
}

/**
 * 混合选项
 */
export interface MixOptions {
  /** 指定的混合类型 */
  mixType?: MixType;
  /** 混合模式 */
  mixMode?: ColorMixMode;
  /** 混合强度 0-1 */
  intensity?: number;
  /** 自定义颜色列表 */
  customColors?: string[];
}

// ============================================================
// 灵感混合器
// ============================================================

/**
 * 灵感混合器类
 * 负责将多个灵感进行混合，生成混合结果
 */
export class InspirationMixer {
  private config: MixerConfig;

  constructor(config: MixerConfig = {}) {
    this.config = {
      defaultMixMode: ColorMixMode.NORMAL,
      autoExtractThemes: true,
      intensityThreshold: 0.3,
      ...config,
    };
  }

  /**
   * 混合多个灵感
   * @param inspirations 要混合的灵感数组（2-3个）
   * @param options 混合选项
   * @returns 混合结果
   */
  mix(inspirations: Inspiration[], options: MixOptions = {}): MixedResult {
    if (inspirations.length < 2) {
      throw new Error('混合至少需要两个灵感');
    }
    
    if (inspirations.length > 3) {
      throw new Error('最多只能混合三个灵感');
    }

    // 确定混合类型
    const mixType = options.mixType || decideMixType(inspirations);
    
    // 确定混合模式
    const mixMode = options.mixMode || this.config.defaultMixMode || ColorMixMode.NORMAL;
    
    // 计算混合强度
    const intensity = options.intensity ?? calculateMixIntensity(inspirations);

    // 获取颜色
    const colors = this.getColors(inspirations, options.customColors);
    
    // 混合颜色
    const mixedColor = this.blendColors(colors, mixMode, intensity);

    // 提取关键词
    const keywords = this.extractMixKeywords(inspirations);

    // 提取氛围词
    const moods = this.extractMoods(inspirations);

    // 合并内容
    const combinedContent = mergeInspirationContent(inspirations);

    return {
      mixedColor,
      mixType,
      keywords,
      moods,
      combinedContent,
    };
  }

  /**
   * 获取要混合的颜色
   */
  private getColors(inspirations: Inspiration[], customColors?: string[]): string[] {
    if (customColors && customColors.length >= 2) {
      return customColors.slice(0, inspirations.length);
    }

    // 使用灵感对应的杯子类型默认颜色
    return inspirations.map(inspiration => {
      return getGlassDefaultColor(inspiration.type);
    });
  }

  /**
   * 混合颜色
   */
  private blendColors(colors: string[], mode: ColorMixMode, intensity: number): string {
    if (colors.length === 2) {
      return mixColors(colors[0], colors[1], mode, intensity);
    }

    // 多个颜色两两混合
    let result = colors[0];
    for (let i = 1; i < colors.length; i++) {
      result = mixColors(result, colors[i], mode, intensity);
    }
    return result;
  }

  /**
   * 提取混合后的关键词
   */
  private extractMixKeywords(inspirations: Inspiration[]): string[] {
    if (!this.config.autoExtractThemes) {
      return [];
    }

    // 提取共同主题
    const commonThemes = extractCommonThemes(inspirations);
    
    // 提取所有关键词
    const allKeywords = inspirations.flatMap(extractKeywords);
    
    // 合并并去重，限制数量
    const uniqueKeywords = [...new Set([...commonThemes, ...allKeywords])];
    
    return uniqueKeywords.slice(0, 10);
  }

  /**
   * 提取氛围词
   */
  private extractMoods(inspirations: Inspiration[]): string[] {
    const moods: string[] = [];
    
    // 基于状态推断氛围
    for (const inspiration of inspirations) {
      const statusMood = getStatusMood(inspiration.status);
      moods.push(statusMood);
      
      // 基于类型推断氛围
      const typeMood = getTypeMood(inspiration.type);
      if (!moods.includes(typeMood)) {
        moods.push(typeMood);
      }
    }
    
    return [...new Set(moods)].slice(0, 5);
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<MixerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 根据状态获取氛围词
 */
function getStatusMood(status: InspirationStatus): string {
  const moodMap: Record<InspirationStatus, string> = {
    [InspirationStatus.SEED]: '萌芽的',
    [InspirationStatus.SPROUT]: '成长的',
    [InspirationStatus.GROW]: '发展的',
    [InspirationStatus.BUD]: '含苞待放的',
    [InspirationStatus.BLOOM]: '绽放的',
  };
  return moodMap[status] || '未定义的';
}

/**
 * 根据类型获取氛围词
 */
function getTypeMood(type: GlassType): string {
  const moodMap: Record<GlassType, string> = {
    [GlassType.BRANDY]: '视觉的',
    [GlassType.CHAMPAGNE]: '听觉的',
    [GlassType.WINE]: '文学的',
    [GlassType.COCKTAIL]: '商务的',
    [GlassType.BEAKER]: '技术的',
    [GlassType.MASON]: '生活的',
    [GlassType.FLASK]: '科学的',
    [GlassType.MARTINI]: '跨界的',
  };
  return moodMap[type] || '混合的';
}

// ============================================================
// 导出单例
// ============================================================

let mixerInstance: InspirationMixer | null = null;

/**
 * 获取灵感混合器单例
 */
export function getMixer(): InspirationMixer {
  if (!mixerInstance) {
    mixerInstance = new InspirationMixer();
  }
  return mixerInstance;
}

/**
 * 创建新的混合器实例
 */
export function createMixer(config?: MixerConfig): InspirationMixer {
  return new InspirationMixer(config);
}
