import { ScoringCacheManager } from '../../../src/services/scoring/cache';
import { Inspiration, GlassType, InspirationStatus, StructuredContent } from '../../../src/types';

const createMockInspiration = (overrides: Partial<Inspiration> = {}): Inspiration => ({
  id: 'test-1',
  name: '测试灵感',
  type: GlassType.COCKTAIL,
  completion: 0,
  status: InspirationStatus.SEED,
  rawInput: { text: '' },
  brewingLog: [],
  brainstormCards: [],
  collisionHistory: [],
  structuredContent: undefined as unknown as StructuredContent,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

describe('ScoringCacheManager', () => {
  let cache: ScoringCacheManager;

  beforeEach(() => {
    cache = new ScoringCacheManager();
  });

  describe('get/set', () => {
    it('应正确设置和获取缓存', () => {
      const inspiration = createMockInspiration();
      const result = {
        totalScore: 85,
        dimensionScores: [],
        status: InspirationStatus.BLOOM,
        evaluatedAt: Date.now(),
        suggestions: [],
      };

      cache.set(inspiration, result);
      const cached = cache.get(inspiration);

      expect(cached).toEqual(result);
    });

    it('无缓存应返回 null', () => {
      const inspiration = createMockInspiration({ id: 'nonexistent' });
      expect(cache.get(inspiration)).toBeNull();
    });

    it('内容变更后应返回 null', () => {
      const inspiration1 = createMockInspiration({ id: 'test', name: '原名称' });
      const result = {
        totalScore: 50,
        dimensionScores: [],
        status: InspirationStatus.GROW,
        evaluatedAt: Date.now(),
        suggestions: [],
      };

      cache.set(inspiration1, result);

      const inspiration2 = createMockInspiration({ id: 'test', name: '新名称' });
      expect(cache.get(inspiration2)).toBeNull();
    });
  });

  describe('clear', () => {
    it('应正确清除指定缓存', () => {
      const inspiration1 = createMockInspiration({ id: 'test1' });
      const inspiration2 = createMockInspiration({ id: 'test2' });
      const result = {
        totalScore: 50,
        dimensionScores: [],
        status: InspirationStatus.GROW,
        evaluatedAt: Date.now(),
        suggestions: [],
      };

      cache.set(inspiration1, result);
      cache.set(inspiration2, result);

      cache.clear('test1');

      expect(cache.get(inspiration1)).toBeNull();
      expect(cache.get(inspiration2)).toEqual(result);
    });

    it('不带参数应清除所有缓存', () => {
      const inspiration1 = createMockInspiration({ id: 'test1' });
      const inspiration2 = createMockInspiration({ id: 'test2' });
      const result = {
        totalScore: 50,
        dimensionScores: [],
        status: InspirationStatus.GROW,
        evaluatedAt: Date.now(),
        suggestions: [],
      };

      cache.set(inspiration1, result);
      cache.set(inspiration2, result);

      cache.clear();

      expect(cache.get(inspiration1)).toBeNull();
      expect(cache.get(inspiration2)).toBeNull();
    });
  });

  describe('computeHash', () => {
    it('相同内容应产生相同哈希', () => {
      const inspiration1 = createMockInspiration({ id: 'test', name: '测试' });
      const inspiration2 = createMockInspiration({ id: 'test', name: '测试' });

      const hash1 = cache.computeHash(inspiration1);
      const hash2 = cache.computeHash(inspiration2);

      expect(hash1).toBe(hash2);
    });

    it('不同内容应产生不同哈希', () => {
      const inspiration1 = createMockInspiration({ id: 'test', name: '测试1' });
      const inspiration2 = createMockInspiration({ id: 'test', name: '测试2' });

      const hash1 = cache.computeHash(inspiration1);
      const hash2 = cache.computeHash(inspiration2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('size', () => {
    it('应正确返回缓存大小', () => {
      expect(cache.size()).toBe(0);

      const inspiration1 = createMockInspiration({ id: 'test1' });
      const inspiration2 = createMockInspiration({ id: 'test2' });
      const result = {
        totalScore: 50,
        dimensionScores: [],
        status: InspirationStatus.GROW,
        evaluatedAt: Date.now(),
        suggestions: [],
      };

      cache.set(inspiration1, result);
      expect(cache.size()).toBe(1);

      cache.set(inspiration2, result);
      expect(cache.size()).toBe(2);

      cache.clear('test1');
      expect(cache.size()).toBe(1);
    });
  });
});
