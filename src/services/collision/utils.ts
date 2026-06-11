/**
 * 碰撞服务 - 工具函数模块
 * 提供颜色混合、类型判断、ID生成等工具函数
 */

import { MixType, GlassType, Inspiration, InspirationStatus } from '../../types';

// ============================================================
// ID 生成
// ============================================================

/**
 * 生成唯一碰撞记录 ID
 */
export function generateCollisionId(): string {
  return `collision_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 生成唯一灵感 ID
 */
export function generateInspirationId(): string {
  return `inspiration_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================
// 颜色处理
// ============================================================

/**
 * 颜色元组类型 (R, G, B)
 */
export type RGB = [number, number, number];

/**
 * HEX 颜色转换为 RGB
 */
export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return [128, 128, 128]; // 默认灰色
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

/**
 * RGB 转换为 HEX
 */
export function rgbToHex(rgb: RGB): string {
  const [r, g, b] = rgb;
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * 颜色混合模式
 */
export enum ColorMixMode {
  NORMAL = 'normal',       // 正常混合
  MULTIPLY = 'multiply',  // 正片叠底
  SCREEN = 'screen',      // 屏幕
  OVERLAY = 'overlay',    // 叠加
}

/**
 * 两种颜色混合
 * @param color1 HEX 颜色
 * @param color2 HEX 颜色
 * @param mode 混合模式
 * @param ratio 混合比例 0-1，0.5 表示各占一半
 */
export function mixColors(
  color1: string,
  color2: string,
  mode: ColorMixMode = ColorMixMode.NORMAL,
  ratio: number = 0.5
): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  let result: RGB;
  
  switch (mode) {
    case ColorMixMode.MULTIPLY:
      result = [
        (rgb1[0] * rgb2[0]) / 255,
        (rgb1[1] * rgb2[1]) / 255,
        (rgb1[2] * rgb2[2]) / 255,
      ];
      break;
      
    case ColorMixMode.SCREEN:
      result = [
        255 - ((255 - rgb1[0]) * (255 - rgb2[0])) / 255,
        255 - ((255 - rgb1[1]) * (255 - rgb2[1])) / 255,
        255 - ((255 - rgb1[2]) * (255 - rgb2[2])) / 255,
      ];
      break;
      
    case ColorMixMode.OVERLAY:
      result = rgb1.map((c, i) => 
        c < 128 
          ? (2 * c * rgb2[i]) / 255 
          : 255 - (2 * (255 - c) * (255 - rgb2[i])) / 255
      ) as RGB;
      break;
      
    case ColorMixMode.NORMAL:
    default:
      result = rgb1.map((c, i) => c * (1 - ratio) + rgb2[i] * ratio) as RGB;
      break;
  }
  
  return rgbToHex(result);
}

/**
 * 多种颜色渐进混合
 * @param colors 颜色数组
 * @param mode 混合模式
 */
export function gradientMixColors(colors: string[], mode: ColorMixMode = ColorMixMode.NORMAL): string[] {
  if (colors.length <= 1) return colors;
  
  const result: string[] = [];
  
  for (let i = 0; i < colors.length - 1; i++) {
    result.push(colors[i]);
    // 在相邻颜色之间插入中间色
    result.push(mixColors(colors[i], colors[i + 1], mode, 0.5));
  }
  
  result.push(colors[colors.length - 1]);
  return result;
}

/**
 * 根据杯子类型获取默认颜色
 */
export function getGlassDefaultColor(type: GlassType): string {
  const colorMap: Record<GlassType, string> = {
    [GlassType.BRANDY]: '#4169E1',    // 钴蓝色 - 绘画/视觉
    [GlassType.CHAMPAGNE]: '#DDA0DD',  // 淡紫色 - 音乐/声音
    [GlassType.WINE]: '#8B0000',       // 深红色 - 文学/文字
    [GlassType.COCKTAIL]: '#D2691E',   // 琥珀色 - 工作/商业
    [GlassType.BEAKER]: '#00FF7F',     // 荧光绿 - 程序/技术
    [GlassType.MASON]: '#FF8C00',      // 暖橙色 - 生活/日常
    [GlassType.FLASK]: '#E0FFFF',     // 透明微蓝 - 科学/研究
    [GlassType.MARTINI]: '#FF69B4',    // 混合色 - 跨界/混合
  };
  
  return colorMap[type] || '#808080';
}

/**
 * 根据灵感状态获取默认颜色
 */
export function getStatusDefaultColor(status: InspirationStatus): string {
  const colorMap: Record<InspirationStatus, string> = {
    [InspirationStatus.SEED]: '#8B4513',    // 种子 - 棕色
    [InspirationStatus.SPROUT]: '#90EE90',  // 萌芽 - 浅绿
    [InspirationStatus.GROW]: '#32CD32',    // 生长 - 绿色
    [InspirationStatus.BUD]: '#FFB6C1',     // 含苞 - 粉色
    [InspirationStatus.BLOOM]: '#FFD700',   // 绽放 - 金色
  };
  
  return colorMap[status] || '#808080';
}

// ============================================================
// 类型判断
// ============================================================

/**
 * 检查是否为有效的灵感对象
 */
export function isValidInspiration(obj: any): obj is Inspiration {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    obj.type in GlassType
  );
}

/**
 * 检查是否为有效的碰撞 ID 列表
 */
export function isValidCollisionSource(ids: string[]): boolean {
  return (
    Array.isArray(ids) &&
    ids.length >= 2 &&
    ids.length <= 3 &&
    ids.every(id => typeof id === 'string' && id.length > 0)
  );
}

// ============================================================
// 内容提取
// ============================================================

/**
 * 从灵感中提取关键词
 */
export function extractKeywords(inspiration: Inspiration): string[] {
  const keywords: string[] = [];
  
  // 从名称中提取
  if (inspiration.name) {
    const nameWords = inspiration.name.split(/[\s,，、]+/).filter(Boolean);
    keywords.push(...nameWords);
  }
  
  // 从原始输入中提取
  if (inspiration.rawInput?.text) {
    const textWords = inspiration.rawInput.text
      .split(/[\s,，、.!?,;]+/)
      .filter(w => w.length > 1);
    keywords.push(...textWords.slice(0, 10));
  }
  
  // 去重
  return [...new Set(keywords)];
}

/**
 * 从多个灵感中提取主题词
 */
export function extractCommonThemes(inspirations: Inspiration[]): string[] {
  const allKeywords = inspirations.flatMap(extractKeywords);
  const keywordCount = new Map<string, number>();
  
  for (const keyword of allKeywords) {
    keywordCount.set(keyword, (keywordCount.get(keyword) || 0) + 1);
  }
  
  // 返回出现次数 >= 2 的关键词
  return Array.from(keywordCount.entries())
    .filter(([, count]) => count >= 2)
    .map(([keyword]) => keyword);
}

/**
 * 合并灵感内容
 */
export function mergeInspirationContent(inspirations: Inspiration[]): string {
  const parts: string[] = [];
  
  for (const inspiration of inspirations) {
    if (inspiration.name) {
      parts.push(`【${inspiration.name}】`);
    }
    if (inspiration.rawInput?.text) {
      parts.push(inspiration.rawInput.text);
    }
    if (inspiration.structuredContent) {
      parts.push(JSON.stringify(inspiration.structuredContent));
    }
  }
  
  return parts.join('\n\n');
}

// ============================================================
// 混合策略
// ============================================================

/**
 * 混合类型决策
 * 根据灵感的状态和类型决定混合方式
 */
export function decideMixType(inspirations: Inspiration[]): MixType {
  // 如果有任何一个灵感处于早期阶段（seed/sprout），使用分层
  const hasEarlyStage = inspirations.some(
    s => s.status === InspirationStatus.SEED || s.status === InspirationStatus.SPROUT
  );
  
  if (hasEarlyStage) {
    return MixType.LAYER;
  }
  
  // 如果所有灵感都在后期阶段，使用混色
  return MixType.BLEND;
}

/**
 * 计算混合强度
 * 基于灵感完成度
 */
export function calculateMixIntensity(inspirations: Inspiration[]): number {
  const avgCompletion = inspirations.reduce((sum, s) => sum + s.completion, 0) / inspirations.length;
  
  // 完成度越高，混合强度越大
  return avgCompletion / 100;
}
