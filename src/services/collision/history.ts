/**
 * 碰撞服务 - 碰撞历史管理模块
 * 负责碰撞记录的存储、查询和管理
 */

import { CollisionRecord, Recipe, Inspiration, MixType, MixedResult } from '../../types';
import { generateCollisionId } from './utils';

// ============================================================
// 类型定义
// ============================================================

/**
 * 碰撞历史存储接口
 */
export interface ICollisionStorage {
  /** 保存碰撞记录 */
  save(record: CollisionRecord): Promise<void>;
  /** 获取碰撞记录 */
  get(id: string): Promise<CollisionRecord | null>;
  /** 获取灵感的所有碰撞记录 */
  getByInspirationId(inspirationId: string): Promise<CollisionRecord[]>;
  /** 获取所有碰撞记录 */
  getAll(): Promise<CollisionRecord[]>;
  /** 删除碰撞记录 */
  delete(id: string): Promise<void>;
  /** 更新碰撞记录 */
  update(id: string, data: Partial<CollisionRecord>): Promise<void>;
  /** 清空所有记录 */
  clear(): Promise<void>;
}

/**
 * 碰撞历史查询选项
 */
export interface CollisionQueryOptions {
  /** 源灵感 ID */
  sourceId?: string;
  /** 混合类型 */
  mixType?: MixType;
  /** 时间范围 */
  startTime?: number;
  endTime?: number;
  /** 排序方式 */
  sortBy?: 'createdAt' | 'score';
  /** 排序顺序 */
  sortOrder?: 'asc' | 'desc';
  /** 分页 */
  limit?: number;
  offset?: number;
}

// ============================================================
// 内存存储实现
// ============================================================

/**
 * 内存碰撞历史存储
 * 适用于单设备场景，数据存储在内存中
 */
export class MemoryCollisionStorage implements ICollisionStorage {
  private records: Map<string, CollisionRecord> = new Map();

  async save(record: CollisionRecord): Promise<void> {
    this.records.set(record.id, { ...record });
    console.log('[CollisionHistory] 碰撞记录已保存:', record.id);
  }

  async get(id: string): Promise<CollisionRecord | null> {
    return this.records.get(id) || null;
  }

  async getByInspirationId(inspirationId: string): Promise<CollisionRecord[]> {
    const results: CollisionRecord[] = [];
    
    for (const record of this.records.values()) {
      if (record.sourceInspirationIds.includes(inspirationId)) {
        results.push(record);
      }
    }
    
    return results;
  }

  async getAll(): Promise<CollisionRecord[]> {
    return Array.from(this.records.values());
  }

  async delete(id: string): Promise<void> {
    this.records.delete(id);
    console.log('[CollisionHistory] 碰撞记录已删除:', id);
  }

  async update(id: string, data: Partial<CollisionRecord>): Promise<void> {
    const existing = this.records.get(id);
    if (existing) {
      this.records.set(id, { ...existing, ...data });
      console.log('[CollisionHistory] 碰撞记录已更新:', id);
    }
  }

  async clear(): Promise<void> {
    this.records.clear();
    console.log('[CollisionHistory] 所有碰撞记录已清空');
  }
}

// ============================================================
// 碰撞历史管理器
// ============================================================

/**
 * 碰撞历史管理器
 * 提供碰撞记录的完整管理功能
 */
export class CollisionHistoryManager {
  private storage: ICollisionStorage;
  private currentRecord: CollisionRecord | null = null;

  constructor(storage?: ICollisionStorage) {
    this.storage = storage || new MemoryCollisionStorage();
  }

  /**
   * 创建新的碰撞记录
   */
  async createRecord(
    sourceIds: string[],
    mixedResult: MixedResult,
    recipes: Recipe[]
  ): Promise<CollisionRecord> {
    const record: CollisionRecord = {
      id: generateCollisionId(),
      sourceInspirationIds: sourceIds,
      mixType: mixedResult.mixType,
      mixColors: [mixedResult.mixedColor],
      recipes,
      createdAt: Date.now(),
    };

    await this.storage.save(record);
    this.currentRecord = record;
    
    console.log('[CollisionHistory] 创建碰撞记录:', record.id);
    return record;
  }

  /**
   * 获取当前碰撞记录
   */
  getCurrentRecord(): CollisionRecord | null {
    return this.currentRecord;
  }

  /**
   * 设置当前碰撞记录
   */
  setCurrentRecord(record: CollisionRecord | null): void {
    this.currentRecord = record;
  }

  /**
   * 选择配方
   */
  async selectRecipe(recipe: Recipe): Promise<void> {
    if (!this.currentRecord) {
      throw new Error('当前没有碰撞记录');
    }

    await this.storage.update(this.currentRecord.id, {
      selectedRecipe: recipe,
    });

    this.currentRecord = {
      ...this.currentRecord,
      selectedRecipe: recipe,
    };

    console.log('[CollisionHistory] 已选择配方:', recipe.title);
  }

  /**
   * 设置生成的新灵感 ID
   */
  async setResultInspirationId(inspirationId: string): Promise<void> {
    if (!this.currentRecord) {
      throw new Error('当前没有碰撞记录');
    }

    await this.storage.update(this.currentRecord.id, {
      resultInspirationId: inspirationId,
    });

    this.currentRecord = {
      ...this.currentRecord,
      resultInspirationId: inspirationId,
    };

    console.log('[CollisionHistory] 已设置结果灵感 ID:', inspirationId);
  }

  /**
   * 查询碰撞记录
   */
  async query(options: CollisionQueryOptions = {}): Promise<CollisionRecord[]> {
    let records = await this.storage.getAll();

    // 按源灵感 ID 过滤
    if (options.sourceId) {
      records = records.filter(r => r.sourceInspirationIds.includes(options.sourceId!));
    }

    // 按混合类型过滤
    if (options.mixType) {
      records = records.filter(r => r.mixType === options.mixType);
    }

    // 按时间范围过滤
    if (options.startTime) {
      records = records.filter(r => r.createdAt >= options.startTime!);
    }
    if (options.endTime) {
      records = records.filter(r => r.createdAt <= options.endTime!);
    }

    // 排序
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';
    
    records.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'createdAt') {
        comparison = a.createdAt - b.createdAt;
      } else if (sortBy === 'score') {
        const scoreA = a.selectedRecipe?.score ?? a.recipes[0]?.score ?? 0;
        const scoreB = b.selectedRecipe?.score ?? b.recipes[0]?.score ?? 0;
        comparison = scoreA - scoreB;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // 分页
    const offset = options.offset || 0;
    const limit = options.limit || records.length;
    
    return records.slice(offset, offset + limit);
  }

  /**
   * 获取灵感的所有碰撞记录
   */
  async getRecordsForInspiration(inspirationId: string): Promise<CollisionRecord[]> {
    return this.storage.getByInspirationId(inspirationId);
  }

  /**
   * 获取最近的碰撞记录
   */
  async getRecentRecords(limit: number = 10): Promise<CollisionRecord[]> {
    return this.query({ sortBy: 'createdAt', sortOrder: 'desc', limit });
  }

  /**
   * 删除碰撞记录
   */
  async deleteRecord(id: string): Promise<void> {
    await this.storage.delete(id);
    
    if (this.currentRecord?.id === id) {
      this.currentRecord = null;
    }
  }

  /**
   * 清空所有碰撞记录
   */
  async clearAll(): Promise<void> {
    await this.storage.clear();
    this.currentRecord = null;
  }

  /**
   * 获取统计信息
   */
  async getStatistics(): Promise<{
    totalCollisions: number;
    byMixType: Record<MixType, number>;
    averageScore: number;
    topRecipes: Recipe[];
  }> {
    const records = await this.storage.getAll();
    
    const byMixType: Record<MixType, number> = {
      [MixType.LAYER]: 0,
      [MixType.BLEND]: 0,
    };
    
    let totalScore = 0;
    let scoredCount = 0;
    const allRecipes: Recipe[] = [];

    for (const record of records) {
      byMixType[record.mixType]++;
      
      if (record.selectedRecipe) {
        totalScore += record.selectedRecipe.score;
        scoredCount++;
        allRecipes.push(record.selectedRecipe);
      }
      
      allRecipes.push(...record.recipes);
    }

    // 获取评分最高的配方
    const topRecipes = allRecipes
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return {
      totalCollisions: records.length,
      byMixType,
      averageScore: scoredCount > 0 ? totalScore / scoredCount : 0,
      topRecipes,
    };
  }
}

// ============================================================
// 导出单例
// ============================================================

let historyManagerInstance: CollisionHistoryManager | null = null;

/**
 * 获取碰撞历史管理器单例
 */
export function getHistoryManager(): CollisionHistoryManager {
  if (!historyManagerInstance) {
    historyManagerInstance = new CollisionHistoryManager();
  }
  return historyManagerInstance;
}

/**
 * 创建碰撞历史管理器实例
 */
export function createHistoryManager(storage?: ICollisionStorage): CollisionHistoryManager {
  return new CollisionHistoryManager(storage);
}
