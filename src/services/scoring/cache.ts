/**
 * 评分缓存管理
 * 避免重复计算，提升性能
 */

import { Inspiration } from '../../types';
import { ScoringResult } from './evaluator';

/**
 * 缓存项
 */
interface CacheItem {
  /** 内容哈希 */
  contentHash: string;
  /** 评分结果 */
  result: ScoringResult;
  /** 缓存时间 */
  timestamp: number;
}

/**
 * 评分缓存管理器
 */
export class ScoringCacheManager {
  private cache: Map<string, CacheItem> = new Map();

  /**
   * 获取缓存
   * @param inspiration 灵感对象
   * @returns 缓存的评分结果，无缓存返回null
   */
  get(inspiration: Inspiration): ScoringResult | null {
    const hash = this.computeHash(inspiration);
    const item = this.cache.get(inspiration.id);
    
    if (item && item.contentHash === hash) {
      return item.result;
    }
    
    return null;
  }

  /**
   * 设置缓存
   * @param inspiration 灵感对象
   * @param result 评分结果
   */
  set(inspiration: Inspiration, result: ScoringResult): void {
    const hash = this.computeHash(inspiration);
    this.cache.set(inspiration.id, {
      contentHash: hash,
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * 清除缓存
   * @param inspirationId 灵感ID，不传则清除所有
   */
  clear(inspirationId?: string): void {
    if (inspirationId) {
      this.cache.delete(inspirationId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 计算内容哈希
   * 使用简单字符串哈希算法
   * @param inspiration 灵感对象
   * @returns 哈希值
   */
  computeHash(inspiration: Inspiration): string {
    const data = [
      inspiration.name,
      inspiration.rawInput?.text,
      inspiration.rawInput?.images?.length || 0,
      inspiration.rawInput?.voice || '',
      inspiration.rawInput?.link || '',
      inspiration.brainstormCards?.length || 0,
      inspiration.brewingLog?.length || 0,
      inspiration.collisionHistory?.length || 0,
      JSON.stringify(inspiration.structuredContent),
      inspiration.updatedAt,
    ].join('|');
    
    // 简单哈希算法
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString(16);
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * 默认缓存实例
 */
export const scoringCache = new ScoringCacheManager();